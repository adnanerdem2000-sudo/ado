/* ================= v11: kupalar, Avrupa, milli turnuvalar ================= */
const EXT_DATA=[['benfica','Benfica','SLB','#e30613','#ffffff',82,'POR'],['porto','Porto','FCP','#00428c','#ffffff',81,'POR'],['sporting','Sporting CP','SCP','#008057','#ffffff',82,'POR'],['braga','Braga','SCB','#d6001c','#ffffff',76,'POR'],
 ['ajax','Ajax','AJA','#d2122e','#ffffff',78,'NED'],['psv','PSV','PSV','#ed1c24','#ffffff',80,'NED'],['feyenoord','Feyenoord','FEY','#e30613','#111111',78,'NED'],['azalk','AZ Alkmaar','AZ','#e30613','#ffffff',75,'NED'],
 ['brugge','Club Brugge','CLB','#0067b1','#111111',78,'BEL'],['unionsg','Union SG','USG','#fdd800','#1d3f8f',75,'BEL'],['anderl','Anderlecht','AND','#4c2382','#ffffff',74,'BEL'],
 ['celtic','Celtic','CEL','#018749','#ffffff',76,'SCO'],['rangers','Rangers','RAN','#1b458f','#ffffff',74,'SCO'],['salzbg','RB Salzburg','RBS','#d40030','#ffffff',76,'AUT'],['sturm','Sturm Graz','STU','#111111','#ffffff',72,'AUT'],
 ['shakh','Shakhtar Donetsk','SHA','#ff7f00','#111111',75,'UKR'],['dinzag','Dinamo Zagreb','DZG','#0047ab','#ffffff',73,'CRO'],['crvena','Kızılyıldız','CZV','#d2122e','#ffffff',74,'SRB'],
 ['olymp','Olympiakos','OLY','#d2122e','#ffffff',76,'GRE'],['paok','PAOK','PAO','#111111','#ffffff',74,'GRE'],['pana','Panathinaikos','PAN','#007841','#ffffff',72,'GRE'],
 ['slavia','Slavia Prag','SLA','#d2122e','#ffffff',75,'CZE'],['sparta','Sparta Prag','SPA','#a50034','#ffffff',73,'CZE'],['plzen','Viktoria Plzeň','PLZ','#d2122e','#1d3f8f',71,'CZE'],
 ['fck','Kopenhag','FCK','#ffffff','#1d3f8f',74,'DEN'],['midtj','Midtjylland','FCM','#111111','#d2122e',72,'DEN'],['bodo','Bodø/Glimt','BOD','#ffd400','#111111',75,'NOR'],['molde','Molde','MOL','#1d3f8f','#ffffff',69,'NOR'],
 ['yb','Young Boys','YB','#ffd400','#111111',72,'SUI'],['basel','Basel','BAS','#d2122e','#1d3f8f',71,'SUI'],['ferenc','Ferencváros','FTC','#1f9d55','#ffffff',72,'HUN'],['qarabag','Karabağ','QAR','#111111','#ffffff',72,'AZE'],
 ['legia','Legia Varşova','LEG','#007a3d','#ffffff',71,'POL'],['lech','Lech Poznań','LPO','#1d3f8f','#ffffff',70,'POL'],['rapid','Rapid Wien','RAP','#00843d','#ffffff',70,'AUT'],['malmo','Malmö','MFF','#79bde8','#ffffff',70,'SWE'],
 ['ludo','Ludogorets','LUD','#007a3d','#ffffff',71,'BUL'],['maccabi','Maccabi Tel Aviv','MTA','#ffd400','#1d3f8f',70,'ISR']];
const EXT={};EXT_DATA.filter(x=>!CLUBS[x[0]]).forEach(([id,name,short,c1,c2,str,nat])=>{EXT[id]={id,name,short,c1,c2,str,str0:str,nat,ext:true};});
const clubObj=id=>CLUBS[id]||EXT[id]||null;
/* ---------- yerel kupalar ---------- */
const DOMC={TR:{name:'Türkiye Kupası',short:'ZTK',r:['1. Tur','2. Tur','3. Tur','4. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{bal:0,l3:0,l2:1,l1:2,sl:3}},
  EN:{name:'FA Cup',short:'FA Cup',r:['1. Tur','2. Tur','3. Tur','4. Tur','5. Tur','Çeyrek Final','Yarı Final','Final'],lg:{en3:0,en2:2,pl:2}},
  ES:{name:'Copa del Rey',short:'Copa',r:['1. Tur','2. Tur','Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{es3:0,es2:0,ll:1}},
  IT:{name:'İtalya Kupası',short:'Coppa',r:['1. Tur','2. Tur','Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{it2:0,it1:2}},
  DE:{name:'DFB Pokal',short:'Pokal',r:['1. Tur','2. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{de3:0,de2:0,de1:0}},
  FR:{name:'Fransa Kupası',short:'CdF',r:['7. Tur','8. Tur','Son 64','Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{fr3:0,fr2:0,fr1:2}},
  PT:{name:'Portekiz Kupası',short:'Taça',r:['3. Tur','4. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{pt1:0}},
  NL:{name:'KNVB Kupası',short:'KNVB',r:['1. Tur','2. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{nl1:0}},
  BE:{name:'Belçika Kupası',short:'Croky',r:['6. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{be1:0}},
  SA:{name:'Kral Kupası',short:'Kral K.',r:['Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{sa1:0}},
  BR:{name:'Copa do Brasil',short:'Copa BR',r:['3. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{br1:0}}};
const EUC={ucl:{name:'UEFA Şampiyonlar Ligi',short:'ŞL',tr:'Şampiyonlar Ligi',lp:8,c:'#1b2a6b'},uel:{name:'UEFA Avrupa Ligi',short:'AL',tr:'Avrupa Ligi',lp:8,c:'#f26c0d'},uecl:{name:'UEFA Konferans Ligi',short:'KL',tr:'Konferans Ligi',lp:6,c:'#1f9d55'}};
Object.assign(DOMC,{SC:{name:'İskoçya Kupası',short:'SFA Cup',r:['4. Tur','5. Tur','Çeyrek Final','Yarı Final','Final'],lg:{sc1:0}},
  GR:{name:'Yunanistan Kupası',short:'GR Kupa',r:['Son 16','Çeyrek Final','Yarı Final','Final'],lg:{gr1:0}},
  AT:{name:'ÖFB Kupası',short:'ÖFB',r:['2. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{at1:0}},
  CH:{name:'İsviçre Kupası',short:'CH Kupa',r:['2. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{ch1:0}},
  DK:{name:'Danimarka Kupası',short:'DBU',r:['3. Tur','Son 16','Çeyrek Final','Yarı Final','Final'],lg:{dk1:0}}});
const EU_SPOTS={pl:[4,2,1],ll:[4,2,1],it1:[4,2,1],de1:[4,2,1],fr1:[3,2,1],sl:[2,1,1],pt1:[2,1,1],nl1:[2,1,1],be1:[1,1,1],sc1:[1,0,1],gr1:[1,1,0],at1:[1,0,1],ch1:[0,1,1],dk1:[1,0,1]};
const ccOf=c=>LEAGUES[c.league]&&LEAGUES[c.league].cc||'TR';
function domEntry(c){const D=DOMC[ccOf(c)];if(!D)return null;const e=D.lg[c.league];if(e==null)return null;if(c.league==='de3'){const top=leagueClubs('de3').sort((a,b)=>b.str-a.str).slice(0,4).map(x=>x.id);if(!top.includes(c.id))return null;}
  if(c.league==='it1'){const top=leagueClubs('it1').sort((a,b)=>b.str-a.str).slice(0,8).map(x=>x.id);if(top.includes(c.id))return 3;}return e;}
function defaultQual(){const q={ucl:[],uel:[],uecl:[],cupW:{}};for(const [lid,sp] of Object.entries(EU_SPOTS)){const ids=leagueClubs(lid).sort((a,b)=>b.str-a.str).map(c=>c.id);let i=0;
  q.ucl.push(...ids.slice(i,i+=sp[0]));q.uel.push(...ids.slice(i,i+=sp[1]));q.uecl.push(...ids.slice(i,i+=sp[2]));}return q;}
function euParticipants(k,q){const own=q[k].slice(),ex=EXT_DATA.map(x=>x[0]).filter(x=>!CLUBS[x]);const s=k==='ucl'?0:k==='uel'?8:16,need=Math.max(0,36-own.length);const pool=ex.slice(s).concat(ex.slice(0,s));return own.concat(pool.slice(0,Math.min(need,pool.length)));}
const cupStr=id=>{const c=clubObj(id);return c?c.str:60;};
/* takvim: lig maçlarından uzak hafta içi günleri */
function cupSlots(fr,used){const cal=G.s.cal,first=cal[0],last=cal[cal.length-1],span=last-first,cand=[];
  for(let d=first+1;d<last;d++){if(d<=G.s.day)continue;if(cal.some(x=>Math.abs(x-d)<=1))continue;const pm=prevMatchDay(d),nm=nextMatchDay(d);if(pm==null||nm==null||nm-pm>16)continue;const w=wdOf(dateOf(d));if(w<1||w>3)continue;cand.push(d);}
  const out=[];let prev=-99;
  for(const f of fr){const t=first+span*f;let best=null,bd=1e9;for(const d of cand){if(d<=prev+4)continue;if([...used].some(u=>Math.abs(u-d)<=2))continue;const dd=Math.abs(d-t);if(dd<bd){bd=dd;best=d;}}
    if(best!=null){used.add(best);prev=best;out.push(best);}else out.push(null);}return out;}
function buildComps(){const c=myClub(),Y=G.s.year,list=[],used=new Set(),L=LEAGUES[c.league];
  if(!L.youth&&G.mode!=='x'){const e=domEntry(c);if(e!=null){const D=DOMC[ccOf(c)],N=D.r.length,fr=D.r.map((_,i)=>0.07+0.88*i/(N-1));
      const days=cupSlots(fr.slice(e),used);const rounds=D.r.slice(e).map((n,i)=>({n,day:days[i],ko:true,neutral:n==='Final'}));
      if(rounds.every(r=>r.day!=null))list.push({id:'dom',type:'dom',cc:ccOf(c),name:D.name,short:D.short,rounds,cur:0,alive:true,res:[],st:{apps:0,goals:0,assists:0},N,e});}}
  const q=(G.qual&&G.qual.y===Y)?G.qual:Object.assign(defaultQual(),{y:Y});G.qual=q;
  for(const k of ['ucl','uel','uecl']){if(!q[k].includes(c.id))continue;const E=EUC[k],parts=euParticipants(k,q),lpN=E.lp;
    const fr=[];for(let i=0;i<lpN;i++)fr.push(0.1+0.42*i/(lpN-1));fr.push(0.58,0.61,0.67,0.7,0.76,0.79,0.85,0.88,0.97);
    const days=cupSlots(fr,used),rounds=[];for(let i=0;i<lpN;i++)rounds.push({n:`Lig aşaması · ${i+1}. maç`,day:days[i],lp:true,home:i%2===0});
    [['Play-off',1],['Play-off',2],['Son 16',1],['Son 16',2],['Çeyrek Final',1],['Çeyrek Final',2],['Yarı Final',1],['Yarı Final',2]].forEach(([n,leg],i)=>rounds.push({n,leg,day:days[lpN+i],ko:true}));
    rounds.push({n:'Final',day:days[lpN+8],ko:true,neutral:true});
    if(rounds.some(r=>r.day==null))continue;
    const pool=parts.filter(x=>x!==c.id).sort((a,b)=>cupStr(b)-cupStr(a)),pots=[0,1,2,3].map(i=>pool.slice(Math.floor(i*pool.length/4),Math.floor((i+1)*pool.length/4)));
    const lpOpps=[];for(let i=0;i<lpN;i++){const pot=shuffle(pots[i%4]).find(x=>!lpOpps.includes(x)&&!(clubObj(x)&&CLUBS[x]&&CLUBS[x].league===c.league));lpOpps.push(pot||pick(pool));}
    list.push({id:k,type:'eu',name:E.name,short:E.short,rounds,cur:0,alive:true,res:[],st:{apps:0,goals:0,assists:0},parts,lpOpps,lp:{p:0,gf:0,ga:0,n:0}});}
  for(const k of list){if(k.type==='eu')k.opp=k.lpOpps[0];else{k.opp=domDraw(k);k.rounds[0].home=Math.random()<0.5;}}
  return {club:c.id,year:Y,list};}
function cupsOf(){if(!G||!G.s||!G.s.cal)return {list:[]};if(G.phase==='tryout')return {list:[]};const s=G.s;if(!s.cups||s.cups.club!==G.club){s.cups=buildComps();}return s.cups;}
function domPool(k){const D=DOMC[k.cc];return Object.values(CLUBS).filter(c=>ccOf(c)===k.cc&&D.lg[c.league]!=null&&c.id!==G.club&&!LEAGUES[c.league].youth);}
function domDraw(k){const r=k.e+k.cur,N=k.N,prog=r/(N-1),pool=domPool(k).filter(c=>{const e=domEntry(c);return e!=null&&e<=r;});if(!pool.length)return null;
  const strs=pool.map(c=>c.str),mn=Math.min(...strs),mx=Math.max(...strs);return wpick(pool.map(c=>[c.id,Math.exp(((c.str-mn)/((mx-mn)||1)-0.5)*prog*3.2)]));}
function euDraw(k){const pool=k.parts.filter(x=>x!==G.club),st=k.cur/k.rounds.length;return wpick(pool.map(x=>[x,Math.exp((cupStr(x)-74)/4*(0.4+st))]));}
function cupDayFor(day){if(!G||!G.s||G.phase!=='season')return null;const cs=cupsOf();for(const c of cs.list){if(!c.alive)continue;const r=c.rounds[c.cur];if(r&&r.day===day)return {c,r};}return null;}
function cupAnyDay(day){const cs=cupsOf();return cs.list.some(c=>c.alive&&c.rounds.some(r=>r.day===day));}
const cupToday=()=>cupDayFor(G.s.day);
function simPair(h,a,neutral){const [lh,la]=lambdas(h.str,a.str);if(neutral){const m=(lh+la)/2,d=(lh-la)/2;return [poisson(m+d*0.8),poisson(m-d*0.8)];}return [poisson(lh),poisson(la)];}
function pens(su,so){let a=0,b=0;for(let i=0;i<5;i++){if(Math.random()<0.76+(su-so)*0.003)a++;if(Math.random()<0.76+(so-su)*0.003)b++;}let g=0;while(a===b&&g++<20){const x=Math.random()<0.75,y=Math.random()<0.75;if(x)a++;if(y)b++;}if(a===b)a++;return [a,b];}
function lpRank(k){const parts=k.parts.filter(x=>x!==G.club),me=k.lp,pts=[];
  for(const id of parts){let p=0,gd=0;for(let i=0;i<k.lpOpps.length;i++){const o=pick(parts.filter(x=>x!==id));const [x,y]=simPair(clubObj(id),clubObj(o)||clubObj(id),false);p+=x>y?3:x===y?1:0;gd+=x-y;}pts.push({id,p,gd});}
  pts.push({id:G.club,p:me.p,gd:me.gf-me.ga,me:true});pts.sort((a,b)=>b.p-a.p||b.gd-a.gd||(a.me?-1:b.me?1:0));const rank=pts.findIndex(x=>x.me)+1,scale=36/pts.length;k.table=pts.slice(0,12).concat(rank>12?[pts[rank-1]]:[]).map(x=>({id:x.id,p:x.p,gd:x.gd,r:pts.indexOf(x)+1}));return Math.round(rank*scale);}
function cupWin(k,id,runner){const yl=seasonLabel(G.s.year),tn=k.type==='eu'?EUC[k.id].tr:k.name;(G.cupW=G.cupW||[]).unshift({y:yl,c:k.name,w:id,r:runner});if(G.cupW.length>60)G.cupW.length=60;
  if(CLUBS[id]&&!(G.mode==='mgr'&&id===G.club)){G.coT=G.coT||{};const co=coachRaw(id),T=G.coT[co.n]=G.coT[co.n]||{};T[tn]=(T[tn]||0)+1;}
  if(k.id==='dom'){G.cupWin=G.cupWin||{};G.cupWin[k.cc]={id,y:G.s.year};}}
function cupDecide(k){if(k.decided)return;k.decided=true;let pool;if(k.type==='eu')pool=k.parts.filter(x=>x!==G.club||k.alive);else pool=domPool(k).map(c=>c.id);
  const w1=wpick(pool.map(x=>[x,Math.exp(cupStr(x)/3.5)])),rest=pool.filter(x=>x!==w1),w2=rest.length?wpick(rest.map(x=>[x,Math.exp(cupStr(x)/3.5)])):w1;const [a,b]=simPair(clubObj(w1),clubObj(w2),true);const win=a>=b?w1:w2,run=win===w1?w2:w1;
  cupWin(k,win,run);msg('gundem',`${k.name} şampiyonu: ${clubObj(win).name}`,`${k.name} finalinde ${clubObj(win).name}, ${clubObj(run).name} karşısında kupayı kaldırdı.`);}
function cupTick(force){if(!G||!G.s||!G.s.cups)return;for(const k of G.s.cups.list){if(k.decided)continue;const fin=k.rounds[k.rounds.length-1];if(!k.alive&&!k.won&&(force||G.s.day>fin.day))cupDecide(k);}}
function cupApply(k,us,them,notes){const r=k.rounds[k.cur],me=myClub(),opp=clubObj(k.opp);k.res.push({n:r.n,opp:k.opp,h:!!r.home,us,them,leg:r.leg||0});let txt='';
  if(r.lp){k.lp.p+=us>them?3:us===them?1:0;k.lp.gf+=us;k.lp.ga+=them;k.lp.n++;k.cur++;
    if(!k.rounds[k.cur]||!k.rounds[k.cur].lp){const rank=lpRank(k);k.lp.rank=rank;
      if(rank<=8){k.cur+=2;txt=`Lig aşamasını ${rank}. sırada bitirdiniz: doğrudan son 16!`;}else if(rank<=24)txt=`Lig aşamasını ${rank}. sırada bitirdiniz: play-off turundasınız.`;else{k.alive=false;k.out='Lig aşaması';txt=`Lig aşamasını ${rank}. sırada bitirdiniz. Avrupa defteri kapandı.`;}
      if(k.alive){k.opp=euDraw(k);const r1=k.rounds[k.cur],r2=k.rounds[k.cur+1];r1.home=Math.random()<0.5;if(r2&&r2.leg===2)r2.home=!r1.home;txt+=` Kura: ${clubObj(k.opp).name}.`;}}
    else{k.opp=k.lpOpps[k.cur];}}
  else if(r.leg===1){k.agg=[us,them];k.cur++;txt=`İlk maç ${us}-${them}. Rövanş ${fmtDate(dateOf(k.rounds[k.cur].day))}.`;}
  else{let a=us,b=them;if(r.leg===2){a+=k.agg[0];b+=k.agg[1];txt=`Toplam skor ${a}-${b}. `;}
    let adv=a>b;if(a===b){const [x,y]=pens(me.str,opp.str);adv=x>y;txt+=`Seri penaltılar: ${x}-${y}. `;}
    if(r.n==='Final'){k.alive=false;k.decided=true;if(adv){k.won=true;const tn=k.type==='eu'?EUC[k.id].name:k.name;G.trophies.push({year:seasonLabel(G.s.year),name:tn,club:G.club});cupWin(k,G.club,k.opp);
        const cs=cstate(G.club);cs.board=clamp(cs.board+(k.type==='eu'?20:12),0,100);if(isPl())bump('fame',k.type==='eu'?(k.id==='ucl'?18:10):6);txt+=`ŞAMPİYON! ${tn} ${me.name} müzesine geliyor!`;}
      else{cupWin(k,k.opp,G.club);txt+=`Finalde kaybettiniz. ${opp.name} kupayı kaldırdı.`;}}
    else if(adv){k.cur++;if(k.type==='eu'){k.opp=euDraw(k);const r1=k.rounds[k.cur],r2=k.rounds[k.cur+1];if(r1.n!=='Final'){r1.home=Math.random()<0.5;if(r2&&r2.leg===2)r2.home=!r1.home;}}else{k.opp=domDraw(k);k.rounds[k.cur].home=Math.random()<0.5;}
      txt+=`Tur atladınız! ${k.rounds[k.cur].n} rakibi: ${clubObj(k.opp).name} (${fmtDate(dateOf(k.rounds[k.cur].day))}).`;}
    else{k.alive=false;k.out=r.n;txt+=`${turLoc(r.n)} elendiniz.`;}}
  if(txt)notes.push(txt);return txt;}
function cupStat(k,res){k.st.apps++;k.st.goals+=res.goals||0;k.st.assists+=res.assists||0;G.totals.apps++;G.totals.goals+=res.goals||0;G.totals.assists+=res.assists||0;}
function playCup(sim){const cu=cupToday();if(!cu)return toast('Bugün kupa maçı yok');const {c:k,r}=cu,me=myClub(),opp=clubObj(k.opp);if(!opp){k.alive=false;nextDay();save();render();return;}
  const usHome=r.neutral?true:!!r.home;let role=!canPlay()?(G.p.injury?'injured':'banned'):decideRole();
  if(k.type==='dom'&&k.cur<k.rounds.length-3){if(role==='squad'&&Math.random()<0.6)role='sub';else if(role==='sub'&&Math.random()<0.45)role='start';}
  const label=`${k.short} · ${r.n}${r.leg?` · ${r.leg}. maç`:''}`;
  if(role!=='start'&&role!=='sub'){const [x,y]=simPair(usHome?me:opp,usHome?opp:me,r.neutral);return cupFinish({us:usHome?x:y,opp:usHome?y:x,played:false},role,null);}
  const cfg=buildMatch(me,opp,usHome,role,label);if(r.neutral){const m=(cfg.lamUs+cfg.lamOpp)/2;cfg.lamUs=m+(cfg.lamUs-m)*0.85;cfg.lamOpp=m+(cfg.lamOpp-m)*0.85;}
  cfg.onEnd=res=>cupFinish(res,role,cfg);(sim?simMatch:startMatch)(cfg);}
function cupFinish(res,role,cfg){const cu=cupToday();if(!cu){nextDay();save();render();return;}const {c:k,r}=cu,me=myClub(),opp=clubObj(k.opp),usHome=r.neutral?true:!!r.home,notes=[],win=res.us>res.opp,draw=res.us===res.opp;
  if(res.played){applyPlayed(res,role,win,draw,notes,curLeague().tier+(k.type==='eu'?1:0),false);cupStat(k,res);scoutUpdate(res.rating||0,true);G.p.playHurt=false;}
  else notes.push(role==='injured'?'Sakatlığın nedeniyle maçı tribünden izledin.':role==='banned'?'Cezalı olduğun için maçta yoktun.':'Kupa kadrosunda yer almadın.');
  (G.s.cupDays=G.s.cupDays||[]).push(G.s.day);cupApply(k,res.us,res.opp,notes);const home=usHome?me:opp,away=usHome?opp:me,hg=usHome?res.us:res.opp,ag=usHome?res.opp:res.us;
  msg('report',`${k.name} · ${r.n}: ${home.name} ${hg}-${ag} ${away.name}`,notes.join(' '));
  nextDay();save();showResult(home,away,hg,ag,res,notes);}
function mgrCup(watch){const cu=cupToday();if(!cu)return;const {c:k,r}=cu,me=myClub(),opp=clubObj(k.opp),usHome=r.neutral?true:!!r.home,S=xiStr(),T=tacT(opp);if(watch===true)return fxStart({opp,usHome,neutral:!!r.neutral,onEnd:(gu,go)=>mgrCup({res:[gu,go]})});
  const [lh,la]=lambdas(usHome?S:opp.str,usHome?opp.str:S);let lu=(usHome?lh:la)*T.f,lo=(usHome?la:lh)*T.a;if(r.neutral){const m=(lu+lo)/2;lu=m+(lu-m)*0.85;lo=m+(lo-m)*0.85;}
  const gu=watch&&watch.res?watch.res[0]:poisson(lu),go=watch&&watch.res?watch.res[1]:poisson(lo),notes=[];(G.s.cupDays=G.s.cupDays||[]).push(G.s.day);cupApply(k,gu,go,notes);const m=G.m;m.conf=clamp(m.conf+(gu>go?3:gu===go?0:-3)+(k.won?15:0),0,100);
  const home=usHome?me:opp,away=usHome?opp:me,hg=usHome?gu:go,ag=usHome?go:gu;msg('report',`${k.name} · ${r.n}: ${home.name} ${hg}-${ag} ${away.name}`,notes.join(' '));nextDay();save();render();
  openModal(`<h3>${esc(k.name)} · ${esc(r.n)}</h3><div class="res-board"><div class="team">${crestSVG(home,38)}<b>${esc(home.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(away,38)}<b>${esc(away.name)}</b></div></div><ul class="notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Devam</button>`);}
function cupTicket(){const cu=cupToday(),{c:k,r}=cu,me=myClub(),opp=clubObj(k.opp),usHome=r.neutral?true:!!r.home;
  return ticketHTML(`${k.name} · ${r.n}${r.leg?` (${r.leg}. maç)`:''}`,`Bugün · ${r.neutral?'Tarafsız saha':usHome?'İç saha':'Deplasman'}`,usHome?me:opp,usHome?opp:me,k.type==='eu'?`<span class="pill" style="background:${EUC[k.id].c};color:#fff">Avrupa gecesi</span> ${r.leg===2?`İlk maç ${k.agg[0]}-${k.agg[1]}`:'Kupa maçı'}`:`<span class="pill warn">Kupa</span> ${r.n==='Final'?'Final maçı!':'Tek maç eleme · berabere biterse penaltılar'}`);}
function cupLine(k){const r=k.rounds[k.cur],o=clubObj(k.opp);if(k.won)return '<span class="pill good">Şampiyon</span>';if(!k.alive)return `<span class="pill">Elendi</span> ${esc(k.out||'')}`;
  return `${esc(r.n)} · ${o?esc(o.name):'—'} · ${fmtDate(dateOf(r.day))}${r.lp?` · ${k.lp.p} puan`:''}`;}
function cupsPanel(){const cs=cupsOf();if(!cs.list.length)return '';return `<section class="panel"><p class="sub-h"><span>Kupalar</span><span>${seasonLabel(G.s.year)}</span></p><ul class="cups">${cs.list.map(k=>`<li class="clk" data-act="cupsView"><i class="cup-ic ${k.type==='eu'?k.id:'dom'}">${k.type==='eu'?k.short:'🏆'}</i><div><b>${esc(k.name)}</b><small>${cupLine(k)}</small></div></li>`).join('')}</ul></section>`;}
function cupsViewHTML(){const cs=cupsOf();let h='';
  for(const k of cs.list){h+=`<section class="panel"><p class="sub-h"><span>${esc(k.name)}</span><span>${k.won?'Şampiyon':k.alive?'Devam ediyor':'Elendi'}</span></p><p class="muted" style="margin:0 0 8px">${cupLine(k)}</p>
    ${k.res.length?`<ul class="cupres">${k.res.map(x=>{const o=clubObj(x.opp),cls=x.us>x.them?'res-w':x.us<x.them?'res-l':'res-d';return `<li><span>${esc(x.n)}${x.leg?' · '+x.leg+'. maç':''}</span><b>${x.h?HOMEI:'<i class="awy"></i>'}${o?esc(o.name):''}</b><em class="${cls}">${x.us}-${x.them}</em></li>`;}).join('')}</ul>`:'<p class="muted">Henüz maç oynanmadı.</p>'}
    ${k.table?`<p class="sub-h" style="margin:10px 0 6px"><span>Lig aşaması</span><span>${k.lp.rank}. sıra</span></p><div class="tbl-wrap"><table><thead><tr><th>#</th><th class="l">Takım</th><th>AV</th><th>P</th></tr></thead><tbody>${k.table.map(x=>{const o=clubObj(x.id);return `<tr class="${x.id===G.club?'me':''}"><td>${Math.round(x.r*36/(k.parts.length))}</td><td class="l club">${o?crestSVG(o,16):''}<span>${o?esc(o.name):''}</span></td><td>${x.gd>0?'+':''}${x.gd}</td><td class="pts">${x.p}</td></tr>`;}).join('')}</tbody></table></div>`:''}</section>`;}
  if(!cs.list.length)h+=`<section class="panel"><p class="muted">Bu sezon kulübün herhangi bir kupada yer almıyor. Üst liglerde yerel kupa, Süper Lig ve 5 büyük ligde de Avrupa kupaları seni bekliyor.</p></section>`;
  h+=natPanel();
  const W=(G.cupW||[]).slice(0,18);if(W.length)h+=`<section class="panel"><p class="sub-h"><span>Son şampiyonlar</span></p><ul class="cupres">${W.map(x=>{const o=clubObj(x.w);return `<li><span>${esc(x.y)}</span><b>${esc(x.c)}</b><em>${o?esc(o.name):''}</em></li>`;}).join('')}</ul></section>`;
  return h;}
/* sezon sonu: Avrupa kotaları ve kupa sonuçları */
function qualNext(){cupTick(true);const q={ucl:[],uel:[],uecl:[],y:G.s.year+1};
  for(const [lid,sp] of Object.entries(EU_SPOTS)){let tb;try{tb=lid===G.s.league?table():tableOf(lid,olSync(lid).res);}catch(e){tb=null;}const ids=tb&&tb.length?tb.map(r=>r.id):leagueClubs(lid).sort((a,b)=>b.str-a.str).map(c=>c.id);
    let i=0;q.ucl.push(...ids.slice(i,i+=sp[0]));q.uel.push(...ids.slice(i,i+=sp[1]));q.uecl.push(...ids.slice(i,i+=sp[2]));}
  for(const [cc,w] of Object.entries(G.cupWin||{})){if(w.y!==G.s.year)continue;if(CLUBS[w.id]&&!q.ucl.includes(w.id)&&!q.uel.includes(w.id)&&EU_SPOTS[CLUBS[w.id].league]){q.uecl=q.uecl.filter(x=>x!==w.id);q.uel.push(w.id);}}
  G.qual=q;const me=G.club;const k=q.ucl.includes(me)?'ucl':q.uel.includes(me)?'uel':q.uecl.includes(me)?'uecl':null;
  if(k)msg('news',`Avrupa bileti: ${EUC[k].name}`,`${myClub().name} gelecek sezon ${EUC[k].name}’nde mücadele edecek.`);}

