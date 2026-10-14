/* ================= v145: gerçekçi an dinamikleri — faul modeli, taç/korner/aut, avantaj, düdük, top sürme ve dönüş ataleti =================
   - Müdahale (bizim ve rakibin): sonuç, gelişin açısına (önden / yandan / arkadan), topa mı adama mı önce ulaşıldığına,
     taşıyanın gövdesinin araya girip girmediğine (topu koruma), hıza, def / dri / fiz özelliklerine ve sahadaki yere bağlıdır.
     Adamı biçen kayma faul sayılır; kart ağırlığa göre: arkadan + hızlı → kırmızı olabilir, son adam (gol şansını engelleme) → kırmızı,
     ceza sahasında topa oynama girişimi varsa sarı. Ceza sahası içinde faul → penaltı.
   - Rakip bize faul yapınca hakem bazen AVANTAJ verir; avantaj 2,6 sn içinde boşa çıkarsa serbest vuruşa döner.
   - Top çizgiyi tamamen geçince oyun durur: taç (son dokunmayan takımın), korner (savunan son dokunduysa) ya da kale vuruşu.
     Kornerler mevkinin senaryo tablosunda korner varsa yeni bir korner anına bağlanır; bizim taçlarımız bazen taç anına bağlanır.
   - Dönüş/ivme sınırı (topla 180° dönüş anlık değil), depar sürüşünde top ayaktan açılır (kapılabilir), hakem düdüğü ve kart çizimi. */

const V145={ac:null,out:null};

/* ---------- yeni sonuç kodları ---------- */
Object.assign(RES,{
  tacO:{t:'TAÇ: TOP RAKİBİN',adj:-0.12,cls:'bad'},tacT:{t:'TAÇ: TOP RAKİBİN',adj:-0.03},
  kvO:{t:'AUT: KALE VURUŞU',adj:-0.1,cls:'bad'},kvT:{t:'AUT: KALE VURUŞU',adj:-0.03},
  tacU:{t:'TAÇ BİZİM',adj:0.04,cls:'ok'},ckU:{t:'KORNER!',adj:0.06,cls:'ok'},kvU:{t:'AUT: TOP BİZİM',adj:0.08,cls:'ok'},
  tacD:{t:'TAÇA ATTIN',adj:0.12,cls:'ok'},ckO:{t:'KORNERE ÇIKTI',adj:-0.03}});
Object.assign(FEED_TXT,{
  tacO:()=>meFs('gen')+' kontrolündeki top taça çıktı; atış rakibin.',tacT:()=>'Top taça çıktı; taç atışı rakibin.',
  kvO:()=>meFs('gen')+' topu çizgiyi geçti; kale vuruşu rakibin.',kvT:()=>'Top auta çıktı; kale vuruşu rakibin.',
  tacU:()=>'Rakip topu taça gönderdi; atış bizde.',ckU:()=>'Top rakipten sekip kornere çıktı!',kvU:()=>'Rakibin topu auta gitti; kale vuruşu bizim.',
  tacD:()=>meF()+' topu taça göndererek tehlikeyi savuşturdu.',ckO:()=>'Top bizden sekip kornere çıktı.'});
Object.assign(PZ_LBL,{tacO:'Topu taça kaçırdı',tacT:'Top taça çıktı',kvO:'Topu auta kaçırdı',kvT:'Top auta çıktı',tacU:'Taç kazandı',ckU:'Korner kazandı',
  kvU:'Rakip topu auta attı',tacD:'Taça gönderdi',ckO:'Top kornere çıktı'});
const V145_NEW=new Set(['tacO','tacT','kvO','kvT','tacU','ckU','kvU','tacD','ckO']);
const V145_FOUL=new Set(['fouled','penWon','foul','penConceded','penSaved','kFoulPen','tacFoul']);
const V145_STOP=new Set([...V145_NEW,'offside','oppOff','oTrap','wide','over','oppMiss','kMiss']);
const V145_GOAL=new Set(['goal','assist','tmGoal','conceded','kGoal','kPenGoal']);

/* ---------- hakem düdüğü (WebAudio ile sentez; törenlerdeki ses ayarına uyar) ---------- */
function v145Snd(){try{if(localStorage.getItem('bdcSnd')==='0')return null;}catch(e){}
  try{const A=V145.ac||(V145.ac=new (window.AudioContext||window.webkitAudioContext)());if(A.state==='suspended')A.resume();return A;}catch(e){return null;}}
function v145Whistle(n,long){const A=v145Snd();if(!A)return;
  try{const t0=A.currentTime+0.02;for(let i=0;i<n;i++){const st=t0+i*0.24,du=long&&i===n-1?0.7:0.16;
    const o=A.createOscillator(),g=A.createGain(),l=A.createOscillator(),lg=A.createGain();o.type='sine';o.frequency.value=2900;l.type='sine';l.frequency.value=34;lg.gain.value=140;
    l.connect(lg);lg.connect(o.frequency);g.gain.setValueAtTime(0.0001,st);g.gain.exponentialRampToValueAtTime(0.06,st+0.02);g.gain.setValueAtTime(0.06,st+du-0.04);g.gain.exponentialRampToValueAtTime(0.0001,st+du);
    o.connect(g);g.connect(A.destination);o.start(st);l.start(st);o.stop(st+du+0.03);l.stop(st+du+0.03);}}catch(e){}}

/* ---------- geometri yardımcıları ---------- */
function v145Dir(a){const sp=Math.hypot(a.vx,a.vy);return sp>1?{x:a.vx/sp,y:a.vy/sp}:{x:a.fx||0,y:a.fy||0};}
/* müdahalenin geldiği yön: topu taşıyanın gidiş yönüne göre önden / yandan / arkadan */
function v145Ang(t,a){const d=v145Dir(a),rx=t.x-a.x,ry=t.y-a.y,rl=Math.hypot(rx,ry)||1,c=(rx*d.x+ry*d.y)/rl;return c>0.35?'front':c<-0.35?'behind':'side';}
/* taşıyanın gövdesi müdahalecinin ayağıyla top arasında mı (top korunuyor mu)? */
function v145Block(t,a,b){const dx=b.x-t.x,dy=b.y-t.y,L2=dx*dx+dy*dy||1,u=((a.x-t.x)*dx+(a.y-t.y)*dy)/L2;if(u<0.05||u>0.98)return false;return Math.hypot(a.x-(t.x+dx*u),a.y-(t.y+dy*u))<0.42;}
const v145InBox=(x,y)=>y<16.5&&Math.abs(x-34)<20.16;
/* gol şansını engelleme (son adam): kaleye yönelen taşıyanla kale arasında (kaleci hariç) savunmacı yok */
function v145Dogso(a,defs,skip){if(a.y>28||Math.abs(a.x-34)>16)return false;if(v145Dir(a).y>-0.3)return false;
  for(const t of defs){if(t===skip||t.isGK||t.wall||t.role==='idle'||t.down>0)continue;if(goalSide(t,a)>0.4)return false;}return Math.random()<0.85;}
function v145Sev(ang,slide,v,ball){return clamp({front:0.15,side:0.32,behind:0.62}[ang]+(slide?0.12:0)+(v>8?0.1:0)-(ball?0.15:0),0.05,0.95);}
function v145Card(ang,slide,v,ball,dg,inBox){const sev=v145Sev(ang,slide,v,ball),r=Math.random();
  if(dg)return inBox&&ball?'Y':'R';if(ang==='behind'&&slide&&v>8&&r<0.04+sev*0.07)return 'R';return r<sev*0.78?'Y':null;}

/* ---------- bizim faulümüz ---------- */
function v145OurFoul(a,f){const S=MG.S,b=S.ball,ce=S.hero,cp=S.mode==='cp',v=f.v??Math.hypot(ce.vx,ce.vy);
  const inBox=!cp&&v145InBox(a.x,a.y),dg=!cp&&v145Dogso(a,S.mates);
  const card=v145Card(f.ang,f.slide,v,f.ball,dg,inBox);
  a.stag=0.8;a.down=Math.max(a.down||0,f.slide?0.9:0.5);a.vx*=0.3;a.vy*=0.3;vib(50);
  if(cp)return endChance('foul',{card,fkY:b.y});
  return endChance(inBox?(Math.random()<0.76?'penConceded':'penSaved'):'foul',{card,fkY:b.y,dogso:dg?1:0});}
defFoul=function(a){const S=MG.S,ce=S.hero;return v145OurFoul(a,{ang:v145Ang(ce,a),ball:false,slide:ce.slide>0});};

/* kayarak müdahale: her karede topa mı adama mı önce değildiği ölçülür */
slideContact=function(){const S=MG.S,C=S.C,ce=S.hero,b=S.ball,a=b.owner;if(S.slideHit||b.held)return;
  const v=Math.hypot(ce.vx,ce.vy),dB=dist(ce,b);
  if(!a){if(dB<0.8&&b.z<0.8){S.slideHit=true;if(Math.random()<clamp(0.55+C.a.def*0.004,0.55,0.92)){b.vx=ce.vx*0.6;b.vy=ce.vy*0.6;b.last=ce;b.lastT=S.t;partsGrass(b.x,b.y,10);vib(40);
      if(S.mode==='cp'){b.kind='loose';mgFlash('TOPA KAYDI!','ok',500);return;}return endChance('tackle');}mgFlash('KAÇIRDI','bad',500);}return;}
  if(a.side!=='opp')return;
  const dM=dist(ce,a),blk=v145Block(ce,a,b),ang=v145Ang(ce,a);
  if(dB<0.62&&b.z<0.7&&!(blk&&dM<0.85)){S.slideHit=true;
    const p=clamp(0.6+C.a.def*0.004-(C.opp.str-60)*0.004+(ang==='front'?0.08:ang==='behind'?-0.15:0)+(dist(b,a)>0.8?0.1:0),0.3,0.95)*(S.cond<30?0.88:1);
    if(Math.random()<p){b.owner=null;b.vx=ce.vx*0.6+rnd(-0.6,0.6);b.vy=ce.vy*0.6+rnd(-0.6,0.6);b.last=ce;b.lastT=S.t;b.kind='loose';partsGrass(b.x,b.y,10);vib(40);
      /* topu aldı ama arkadan, hızla adamı da biçtiyse ölçüsüz müdahale: yine faul */
      if(Math.random()<(ang==='behind'?0.18+(v>8?0.1:0):ang==='side'?0.04:0))return v145OurFoul(a,{ang,v,ball:true,slide:true});
      a.down=Math.max(a.down||0,0.5);
      if(S.mode==='cp'){mgFlash('TOPA KAYDI!','ok',500);return;}return endChance('tackle');}
    if(Math.random()<0.5){a.jumpT=S.t;mgFlash('ÜSTÜNDEN ATLADI','bad',500);return;}
    return v145OurFoul(a,{ang,v,ball:true,slide:true});}
  if(dM<0.6){S.slideHit=true;
    if(Math.random()<clamp(0.1+(C.opp.str-60)*0.003+(ang==='front'?0.08:0),0.04,0.3)){a.jumpT=S.t;mgFlash('ÜSTÜNDEN ATLADI','bad',500);return;}
    return v145OurFoul(a,{ang,v,ball:false,slide:true});}};

/* ayakta müdahale */
function v145Stand(){const S=MG.S,C=S.C,ce=S.hero,b=S.ball;if(ce.down>0||ce.slide>0||ce.stag>0||S.t<S.tkCd)return;S.tkCd=S.t+0.6;ce.kickT=0.3;
  const a=b.owner,d=dist(ce,b),cp=S.mode==='cp';
  if(!a){if(d<1.4&&b.z<1.2&&!b.held){if(cp)return regain(ce);return endChance('intercept');}return;}
  if(a.side!=='opp')return;
  if(d>1.65){ce.stag=0.25;return;}
  const ang=v145Ang(ce,a),dM=dist(ce,a),blk=v145Block(ce,a,b),gap=dist(a,b);
  const p=clamp(0.22+C.a.def*0.006-C.opp.str*0.003+{front:0.06,side:0,behind:-0.2}[ang]+(cp?0.1:0)+(S.pressing?0.05:0)+(gap>0.75?0.1:0)-(blk?0.2:0)+(d<dM?0.04:-0.04),0.05,0.86)*(S.cond<30?0.85:1);
  if(Math.random()<p){b.owner=null;vib(30);if(cp)return regain(ce);return endChance('tackle');}
  if(Math.random()<{front:0.1,side:0.2,behind:0.48}[ang]+(blk?0.15:0)+(S.cond<30?0.06:0))return v145OurFoul(a,{ang,ball:false,slide:false});
  ce.stag=0.5;a.vx+=(a.x>=ce.x?1:-1)*2.5;mgFlash('BOŞA ÇIKTI','bad',500);}
standTackle=(old=>function(){const S=MG.S;if(!S||S.gkm)return old.apply(this,arguments);const c0=S.tkCd;const r=v145Stand();try{if(S.act&&S.tkCd!==c0)S.act.tk++;}catch(e){}return r;})(standTackle);

/* ---------- rakibin bize faulü (avantaj kuralıyla) ---------- */
function v145FoulOnUs(d,o,f){const S=MG.S,b=S.ball,v=Math.hypot(d.vx,d.vy),inBox=v145InBox(b.x,b.y);
  const dg=S.mode==='atk'&&v145Dogso(o,actOpps(),d),card=v145Card(f.ang,f.slide,v,f.ball,dg,inBox);
  const hurt=o.isC&&Math.random()<(0.06+v145Sev(f.ang,f.slide,v,f.ball)*0.12)*proneF();
  d.stag=0.6;d.vx*=0.3;d.vy*=0.3;vib(50);
  if(!inBox&&!hurt&&card!=='R'&&b.owner===o&&S.mode==='atk'&&b.y<36&&!S.adv&&Math.random()<0.3){
    S.adv={t:S.t,fkY:b.y,card};o.stag=Math.max(o.stag,0.15);d.down=0.9;mgFlash('AVANTAJ!','ok',900);return;}
  o.stag=Math.max(o.stag,0.7);if(hurt)o.down=3;else o.down=Math.max(o.down||0,f.slide?0.8:0.4);
  return endChance(inBox?'penWon':'fouled',{fkY:b.y,injured:hurt,injKind:'darbe',oppCard:card});}
tackleOn=function(d,o,exposed){const S=MG.S,C=S.C,b=S.ball,iq=S.iqOpp;d.cd=0.55;d.kickT=0.3;
  const sprint=o.isC&&S.sprint,still=Math.hypot(o.vx,o.vy)<1.2,skill=o.isC?C.a.dri:C.us.str*0.8;
  const ang=v145Ang(d,o),blk=v145Block(d,o,b),gap=dist(o,b);
  const shield=ang==='behind'&&!sprint&&gap<0.8?0.08+(o.isC?C.a.fiz:C.us.str)*0.0025:0;
  let p=0.17+iq*0.26+C.opp.str*0.0042-skill*0.0042+(exposed?0.12+iq*0.08:0)+(sprint?0.05:0)+(d.read?0.25:0)+(still?0.1:0)+(o.isC&&o.dash>0?-0.3:0)+(o.isC&&C.hurt?0.06:0)+(o.isC&&S.cond<30?0.06:0)
    +{front:0.04,side:0,behind:-0.22}[ang]-(blk?0.18:0)-shield;d.read=false;p=clamp(p,0.05,0.86);
  let pf={front:0.05,side:0.1,behind:0.34}[ang]+(blk?0.14:0)+(1-iq)*0.05;if(v145InBox(b.x,b.y))pf*=0.6;
  const r=Math.random();
  if(r<pf)return v145FoulOnUs(d,o,{ang,slide:false,ball:false});
  if(r<pf+p){b.owner=d;partsGrass(b.x,b.y,8);vib(40);if(o.isC)o.stag=Math.max(o.stag,0.3);return lostBall(d);}
  d.stag=0.28+(1-iq)*0.55;if(o.isC)o.stag=Math.max(o.stag,0.1*iq);};
oppSlideContact=function(d){const S=MG.S,C=S.C,b=S.ball,o=b.owner;if(!o||o.side!=='us'||b.held)return;
  const dB=dist(d,b),dM=dist(d,o),blk=v145Block(d,o,b),ang=v145Ang(d,o);
  if(dB<0.62&&b.z<0.6&&!(blk&&dM<0.85)){d.slideHit=true;const skill=o.isC?C.a.dri:C.us.str*0.8;
    const p=clamp(0.5+S.iqOpp*0.2-(skill-C.opp.str)*0.004+(ang==='front'?0.06:ang==='behind'?-0.15:0)+(dist(b,o)>0.8?0.12:0),0.2,0.85);
    if(Math.random()<p){if(Math.random()<(ang==='behind'?0.2:ang==='side'?0.04:0))return v145FoulOnUs(d,o,{ang,slide:true,ball:true});
      b.owner=null;b.vx=d.vx*0.55+rnd(-1.5,1.5);b.vy=d.vy*0.55+rnd(-1,1);b.last=d;b.lastT=S.t;b.kind='loose';o.stag=Math.max(o.stag,0.4);partsGrass(b.x,b.y,10);vib(40);mgFlash('KAYARAK MÜDAHALE','bad',600);return;}
    if(o.isC&&Math.random()<0.25+C.a.dri*0.003){o.jumpT=S.t;mgFlash('ÜSTÜNDEN ATLADIN!','ok',550);return;}
    return v145FoulOnUs(d,o,{ang,slide:true,ball:true});}
  if(dM<0.6){d.slideHit=true;if(o.isC&&Math.random()<0.12+C.a.dri*0.002){o.jumpT=S.t;mgFlash('ÜSTÜNDEN ATLADIN!','ok',550);return;}
    return v145FoulOnUs(d,o,{ang,slide:true,ball:false});}};
/* avantaj boşa çıkarsa (top kaybı) hakem geri dönüp serbest vuruş verir */
lostBall=(old=>function(d){const S=MG.S;if(S&&S.adv&&S.t-S.adv.t<2.6)return endChance('fouled',{});return old.apply(this,arguments);})(lostBall);

/* ---------- top oyun alanını terk etti ---------- */
const v145Skip=S=>!S||!!S.gates||S.type==='drill'||(S.mode==='set'&&!S.kicked);
function v145Mark(x,y,k){const S=MG.S;V145.out={x:clamp(x,-0.5,68.5),y:Math.max(-0.3,y),k,t:S?S.t:0,S};}
outGL=(old=>function(cx,cz){const S=MG.S;if(v145Skip(S)||S.ck)return old.apply(this,arguments);const b=S.ball,L=b.last,def=S.mode==='def',atkSide=def?'opp':'us';
  if(b.kind==='shot'&&L&&L.side===atkSide){v145Mark(cx,0,'kv');return old.apply(this,arguments);}
  if(L&&L.side!==atkSide){v145Mark(cx,0,'ck');return endChance(def?'ckO':(S.reb||'ckU'),{rs:'ck'});}
  v145Mark(cx,0,'kv');if(def)return endChance('kvU',{rs:'kv'});
  return endChance(S.reb||(L&&!L.isC?'kvT':'kvO'),{rs:'kv'});})(outGL);
outTouch=(old=>function(){const S=MG.S,b=S.ball;if(v145Skip(S)||b.y>70)return old.apply(this,arguments);
  const L=b.owner||b.last,us=L&&L.side==='us';v145Mark(b.x<34?0:68,b.y,'tac');
  if(S.mode==='def')return endChance(us?(L.isC?'tacD':'defOk'):'tacU',{rs:'tac'});
  if(us)return endChance(S.reb||(L.isC?'tacO':'tacT'),{rs:'tac'});
  return endChance(S.reb||'tacU',{rs:'tac'});})(outTouch);
/* ayaktaki top: çizgiye doğru sürülürse çıkar; durur ya da paralel giderse oyuncu topu ayağıyla içeride tutar */
function v145OwnOut(){const S=MG.S,b=S.ball,o=b.owner;if(!o||o.isGK||b.held)return false;if(S.tac&&o===S.hero)return false;
  const R=0.11,ox=b.x<-R?-1:b.x>68+R?1:0,oy=b.y<-R;if(!ox&&!oy)return false;
  const toward=(ox&&ox*o.vx>1.2)||(oy&&o.vy<-1.2&&!(b.x>GL&&b.x<GR));
  if(!toward){b.x=clamp(b.x,-R+0.01,68+R-0.01);if(oy)b.y=-R+0.01;return false;}
  b.owner=null;b.last=o;b.lastT=S.t;b.kind=null;
  if(ox){outTouch();return true;}outGL(b.x,0);return true;}
checkBall=(old=>function(){const S=MG.S;if(!v145Skip(S)&&S.phase==='play'&&S.mode!=='cp'&&!S.ck&&v145OwnOut())return;return old.apply(this,arguments);})(checkBall);
checkBallCP=(old=>function(){const S=MG.S,b=S.ball;if(v145Skip(S)||S.phase!=='play')return old.apply(this,arguments);
  if(v145OwnOut())return;
  if(!b.owner&&!b.held){const L=b.last,us=L&&L.side==='us';
    if(b.x<-0.11||b.x>68.11){v145Mark(b.x<34?0:68,b.y,'tac');return endChance(us?(L.isC?'tacO':'tacT'):'tacU',{rs:'tac'});}
    if(b.y<0){v145Mark(b.x,0,us?'kv':'ck');return endChance(us?(L.isC?'kvO':'kvT'):'ckU',{rs:us?'kv':'ck'});}}
  return old.apply(this,arguments);})(checkBallCP);

/* ---------- sonuç: avantajın geri alınması, kaleci modları, düdük, kart ---------- */
endChance=(old=>function(code,extra){const S=MG.S;if(!S||S.phase==='end'||S.phase==='replay')return old.apply(this,arguments);extra=Object.assign({},extra||{});
  try{if(S.adv){if(S.t-S.adv.t<2.6&&['lost','timeout','tacO','tacT','kvO','kvT','presFail'].includes(code)){code='fouled';extra.fkY=S.adv.fkY;extra.advBack=1;}
      if(S.adv.card&&!extra.oppCard)extra.oppCard=S.adv.card;}
    if(S.gkm==='dist')code={tacO:'kDistBad',tacT:'kDistBad',kvO:'kDistBad',kvT:'kDistBad',tacU:'kDistOk',ckU:'kDistOk'}[code]||code;
    else if(S.gkm==='save')code={tacU:'kOk',kvU:'kMiss',tacD:'kOk',ckO:'kOk'}[code]||code;}catch(e){}
  const r=old.call(this,code,extra);
  try{const R=S.res;if(R&&S.phase==='end'){const c=R.code;
    if(V145_NEW.has(c)&&R.tr==null){const k=RES[c].cls;R.tr=k==='ok'?0.55:k==='bad'?0.15:0.35;}
    if(V145_FOUL.has(c))v145Whistle(2,c==='penWon'||c==='penConceded'||c==='penSaved'||c==='kFoulPen');else if(V145_GOAL.has(c))v145Whistle(1,true);else if(V145_STOP.has(c))v145Whistle(1,false);
    const fl=$('#mgFlash');if(fl&&fl.textContent){if(extra.advBack)fl.textContent='AVANTAJ GERİ ALINDI\n'+fl.textContent;if(extra.oppCard)fl.textContent+=extra.oppCard==='R'?'\nRAKİBE KIRMIZI KART':'\nRAKİBE SARI KART';}
    if(R.card)S.v145card={c:R.card,me:1,t:S.t};else if(extra.oppCard)S.v145card={c:extra.oppCard,me:0,t:S.t};
    if(!extra.rs&&!V145_STOP.has(c))V145.out=null;}}catch(e){}
  return r;})(endChance);
/* maç akışı: rakibe kart yazısı, korner / taç zinciri */
applyChance=(old=>function(res,m){const n0=typeof MR!=='undefined'&&MR&&MR.events?MR.events.length:0;const r=old.apply(this,arguments);
  try{if(typeof MR==='undefined'||!MR||!res)return r;
    if(res.oppCard)feed(m,res.oppCard==='R'?'Hakem faulü yapan rakip oyuncuya kırmızı kart gösterdi!':'Faulü yapan rakip oyuncu sarı kart gördü.','');
    if(res.advBack)feed(m,'Hakem önce avantaj verdi, atak sönünce faulü geri çaldı.','');
    if(MR.out||m>=89||MR.events.length>n0||!res.rs)return r;
    const pz=typeof PZ!=='undefined'&&PZ.on,g=pz?pzGrp():null,has=t=>!pz||PZ_SCL.some(s=>s.type===t&&s.w[g]);
    if(pz?PZ.chain>=4:(MR.chain||0)>=3)return r;
    const c=res.code;let nx=null;
    if(res.rs==='ck'&&['ckO','kOk'].includes(c)){if(has('dkorner')&&Math.random()<0.5)nx={type:'dkorner',pre:'Top kornere çıktı; rakip korner kullanacak.'};}
    else if(res.rs==='ck'){if(has('korner')&&Math.random()<0.8)nx={type:'korner',pre:'Top kornere çıktı.'};}
    else if(res.rs==='tac'&&['tacU','kOk'].includes(c)&&g!=='KL'&&Math.random()<0.25){nx=pz&&PZ_SC.b_tac&&PZ_SC.b_tac.w[g]?{type:'atak',sc:'b_tac',fam:'atk',pre:'Taç atışı bizde.'}:{type:'atak',pre:'Taç atışıyla oyun yeniden başladı.'};}
    if(nx){if(pz)PZ.chain++;else MR.chain=(MR.chain||0)+1;MR.events.splice(MR.ei,0,Object.assign({m,k:'ch'},nx));}}catch(e){console.warn('v145 zincir',e);}
  return r;})(applyChance);

/* ---------- hareket: ivme ve dönüş sınırı, depar sürüşünde açılan top ---------- */
function v145Cap(e,vx0,vy0,cap){const dvx=e.vx-vx0,dvy=e.vy-vy0,dv=Math.hypot(dvx,dvy);if(dv<=cap)return;const k=cap/dv,nvx=vx0+dvx*k,nvy=vy0+dvy*k,dt=1/120;
  e.x+=(nvx-e.vx)*dt;e.y+=(nvy-e.vy)*dt;e.vx=nvx;e.vy=nvy;const sp=Math.hypot(nvx,nvy);if(sp>0.5){e.fx=nvx/sp;e.fy=nvy/sp;}}
moveMe=(old=>function(dt){const S=MG.S;if(!S||(S.gkm==='save'&&S.ball.owner!==S.hero))return old.apply(this,arguments);const ce=S.hero,busy0=ce.slide>0||ce.down>0||ce.dash>0,vx0=ce.vx,vy0=ce.vy;
  const r=old.apply(this,arguments);
  try{if(!busy0&&MG.S===S&&ce.slide<=0&&ce.dash<=0&&ce.down<=0&&!S.tac){const own=S.ball.owner===ce,A=S.C.a,wet=S.wx==='yagmur'||S.wx==='kar'?0.85:1;
    v145Cap(ce,vx0,vy0,(own?18+A.dri*0.1:24+A.hiz*0.1)*wet*dt);ce.x=clamp(ce.x,0.3,67.7);ce.y=clamp(ce.y,0.4,66);}}catch(e){}
  return r;})(moveMe);
steer=(old=>function(e,tx,ty,sp,dt){const vx0=e.vx,vy0=e.vy;const r=old.apply(this,arguments);
  try{const S=MG.S;if(S&&S.phase==='play'&&!e.isGK&&!e.wall&&!e.isC)v145Cap(e,vx0,vy0,(S.ball.owner===e?20:28)*dt);}catch(x){}return r;})(steer);
attach=(old=>function(dt){const S=MG.S,b=S.ball,o=b.owner;const r=old.apply(this,arguments);
  try{if(o&&o.isC&&!S.tac&&S.mode==='atk'){const sp=Math.hypot(o.vx,o.vy),dri=S.C.a.dri;let tg=0;
      if(S.sprint&&sp>5.2){S.knPh=((S.knPh||0)+sp*dt/(2.0+dri*0.012))%1;tg=Math.max(0.12,0.6-dri*0.004)*(1-S.knPh);}else S.knPh=0;
      S.knX=(S.knX||0)+(tg-(S.knX||0))*Math.min(1,dt*20);if(S.knX>0.005){const k=Math.min(1,dt*18);b.x+=o.fx*S.knX*k;b.y+=o.fy*S.knX*k;}}else if(S)S.knX=0;}catch(e){}
  return r;})(attach);

/* ---------- çizim: kart ve top çıkış noktası ---------- */
function v145Draw(c){const S=MG.S;if(!S)return;const W=MG.W,H=MG.H;
  const o=V145.out;if(o&&o.S===S&&S.phase==='end'&&S.t-o.t<2.4){const P=proj(o.x,o.y,0);if(P){const a=clamp(1-(S.t-o.t)/2.4,0,1),r=Math.max(6,0.9*P.s)*(1+0.25*Math.sin(S.t*9));
      c.globalAlpha=a;c.strokeStyle='#ffd400';c.lineWidth=2.5;c.beginPath();c.ellipse(P.x,P.y,r,r*0.4,0,0,7);c.stroke();
      c.font='900 13px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.fillStyle='#fff';c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=3;
      const t={tac:'TAÇ',ck:'KORNER',kv:'AUT'}[o.k]||'';c.strokeText(t,clamp(P.x,30,W-30),clamp(P.y-r*0.6-6,14,H-8));c.fillText(t,clamp(P.x,30,W-30),clamp(P.y-r*0.6-6,14,H-8));c.globalAlpha=1;}}
  const k=S.v145card;if(k&&k.c&&S.t-k.t<2.2){const u=S.t-k.t,a=clamp(Math.min(u*5,(2.2-u)*3),0,1),x=W*0.84,y=H*0.29,w=26,h=36;
    c.save();c.globalAlpha=a;c.translate(x,y);c.rotate(-0.12+Math.sin(u*3)*0.03);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-w/2+3,-h/2+3,w,h);
    c.fillStyle=k.c==='R'?'#e0262d':'#ffd400';c.fillRect(-w/2,-h/2,w,h);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.5;c.strokeRect(-w/2,-h/2,w,h);c.restore();
    c.globalAlpha=a;c.font='800 12px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.fillStyle='#fff';c.fillText(k.me?'SANA':'RAKİBE',x,y+h/2+16);c.globalAlpha=1;}
  if(S.adv&&S.phase==='play'&&S.t-S.adv.t<2.6){c.globalAlpha=clamp(2.6-(S.t-S.adv.t),0,1)*0.9;c.font='900 14px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.fillStyle='#7dff9a';c.fillText('↗ AVANTAJ',W/2,H*0.14);c.globalAlpha=1;}}
window.mgDrawExtra=(old=>function(c){if(old)try{old(c);}catch(e){}try{v145Draw(c);}catch(e){}})(typeof window.mgDrawExtra==='function'?window.mgDrawExtra:null);
