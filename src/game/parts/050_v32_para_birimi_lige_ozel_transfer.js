/* ================= v32: Para birimi € · lige özel transfer dönemleri · Avrupa kupaları · lig tablosu ================= */
/* ---------- para birimi: oyunun tamamı € ---------- */
const KUR={eur:55.32,d:'9 Ekim 2026'};
const tl=v=>'₺'+(v>=1e9?dec(v/1e9,2)+' Mr':v>=1e6?dec(v/1e6,1)+' Mn':Math.round(v).toLocaleString('tr-TR'));
const tlOf=n=>tl(n/EUR_TL*KUR.eur);
/* ---------- transfer dönemleri ---------- */
/* [yaz kapanış],[kış açılış],[kış kapanış] (ay 0-11, gün) */
const TW={TR:[[8,11],[0,5],[1,6]],EN:[[8,1],[0,1],[1,2]],ES:[[8,1],[0,2],[1,2]],IT:[[8,1],[0,2],[1,2]],DE:[[8,1],[0,2],[1,2]],FR:[[8,1],[0,1],[1,2]],PT:[[8,1],[0,2],[1,2]],NL:[[8,1],[0,2],[1,2]],
  BE:[[8,6],[0,1],[1,2]],SA:[[8,10],[0,1],[0,31]],BR:[[8,2],[0,10],[2,3]],SC:[[8,1],[0,1],[1,2]],GR:[[8,9],[0,2],[1,2]],AT:[[8,2],[0,1],[1,9]],CH:[[8,9],[0,1],[1,16]],DK:[[8,1],[0,2],[1,2]]};
const TW_OPEN=[5,15];
function twCC(lid){const L=LEAGUES[lid||(G&&G.s&&G.s.league)];return L&&TW[L.cc]?L.cc:'TR';}
function twInfo(cc,Y){cc=cc||twCC();Y=Y||(G&&G.s?G.s.year:2026);const T=TW[cc]||TW.TR;
  return {cc,so:Math.round((Date.UTC(Y,TW_OPEN[0],TW_OPEN[1])-seasonStartTs(Y))/DAY_MS),sc:dayOfDate(Y,T[0][0],T[0][1]),wo:dayOfDate(Y,T[1][0],T[1][1]),wc:dayOfDate(Y,T[2][0],T[2][1]),nso:dayOfDate(Y,TW_OPEN[0],TW_OPEN[1])};}
function twOpenAt(d,cc){const I=twInfo(cc);return d<=I.sc||(d>=I.wo&&d<=I.wc)||d>=I.nso;}
function twOpen(){if(!G||!G.s||!G.s.cal)return true;if(G.phase!=='season')return true;return twOpenAt(G.s.day);}
function twNextOpen(){const I=twInfo(),d=G.s.day;return d<I.wo?I.wo:d>I.wc&&d<I.nso?I.nso:d;}
function twCloseDay(){const I=twInfo(),d=G.s.day;return d<=I.sc?I.sc:d<=I.wc?I.wc:null;}
const twD=d=>{const x=dateOf(d);return `${x.getUTCDate()} ${TR_MONTHS[x.getUTCMonth()]}`;};
function twNextTxt(){if(twOpen()){const c=twCloseDay();return c!=null?`kapanış ${fmtDate(dateOf(c))}`:'sezon arası açık';}return `açılış ${fmtDate(dateOf(twNextOpen()))}`;}
function twClosedTxt(){return `Pencere kapalı (${esc(CC[twCC()]||'')}: ${twNextTxt()}). Şimdi oyuncuları inceleyebilir, karşılaştırabilir ve izleme listene alabilirsin; teklifler pencere açılınca yapılır. Serbest oyuncular her zaman imzalanabilir.`;}
function twPill(){const o=twOpen();return `<span class="tw-pill ${o?'on':'off'}" title="${esc(CC[twCC()]||'')} transfer dönemi">${o?'Transfer dönemi açık':'Transfer dönemi kapalı'} · ${esc(twNextTxt())}</span>`;}
function twRows(cc){const I=twInfo(cc);return [['Yaz dönemi',`${twD(I.so)} – ${twD(I.sc)}`],['Kış dönemi',`${twD(I.wo)} – ${twD(I.wc)}`]];}
/* sezon başında kış penceresini lig ülkesine göre ayarla (eski kod G.s.win kullanıyor) */
function twSync(){if(!G||!G.s||!G.s.cal)return;const I=twInfo();if(!G.s.win||G.s.win.open!==I.wo||G.s.win.close!==I.wc)G.s.win={open:I.wo,close:I.wc};}
/* pencere kapalıyken kulübe gelen transferleri beklet */
function twGuard(fn){return function(){if(!G||twOpen())return fn.apply(this,arguments);const before=Object.assign({},G.tx||{});const out=fn.apply(this,arguments);
    try{const tx=G.tx||{};for(const k of Object.keys(tx)){if(tx[k]!==G.club||before[k]===G.club)continue;const p=pByKey(k),from=before[k]||(p&&p.home);if(before[k]===undefined)delete tx[k];else tx[k]=before[k];if(typeof txUnnote==='function')txUnnote(k,G.club);
        G.twPend=G.twPend||[];if(!G.twPend.some(x=>x.k===k))G.twPend.push({k,to:G.club,from});syncStr(G.club);if(from&&CLUBS[from])syncStr(from);
        msg('board','Transfer dönemi bekleniyor',`${p?p.name:'Oyuncu'} için anlaşma sağlandı. Pencere kapalı olduğu için transfer ${fmtDate(dateOf(twNextOpen()),true)} tarihinde resmileşecek.`);}}catch(e){console.warn(e);}
    return out;};}
function twFlush(){const L=G.twPend||[];if(!L.length)return;for(const x of L){const p=pByKey(x.k);if(!p)continue;G.tx=G.tx||{};G.tx[x.k]=x.to;txNote(x.k,x.to,typeof price==='number'&&price<1e10?price:undefined);syncStr(x.to);if(x.from&&CLUBS[x.from])syncStr(x.from);
    msg('board','Transfer resmileşti',`${p.name} transfer döneminin açılmasıyla birlikte resmen ${CLUBS[x.to]?CLUBS[x.to].name:''} oyuncusu oldu.`);}G.twPend=[];if(typeof scClean==='function')try{scClean();}catch(e){}}
nextDay=(old=>function(){if(!G||!G.s)return old.apply(this,arguments);twSync();const S0=G.s,inS=G.phase==='season',was=inS?twOpen():null;const r=old.apply(this,arguments);
  try{if(inS&&G.s===S0&&G.phase==='season'){twSync();const now=twOpen(),cn=CC[twCC()]||'';
      if(was&&!now)msg('news','Transfer dönemi kapandı',`${cn} transfer dönemi kapandı. Bir sonraki pencere ${fmtDate(dateOf(twNextOpen()),true)} tarihinde açılacak. Bu sürede gözlem, analiz ve önerilere devam edebilirsin; transferler bekletilir.`);
      if(!was&&now){if(!isPl())msg('news','Transfer dönemi açıldı',`${cn} kış transfer dönemi açıldı; ${fmtDate(dateOf(twInfo().wc),true)} tarihine kadar transfer yapılabilir.`);twFlush();
        if(G.mode==='mgr'&&G.m&&G.m.wl&&G.m.wl.length)msg('board','İzleme listen hazır',`Transfer dönemi açıldı. İzleme listende ${G.m.wl.length} oyuncu var; Transfer ekranından teklif yapabilirsin.`);}}}catch(e){console.warn(e);}
  return r;})(nextDay);
if(typeof scReport==='function')scReport=twGuard(scReport);
if(typeof rqResolve==='function')rqResolve=twGuard(rqResolve);
if(ACTX.scPush)ACTX.scPush=twGuard(ACTX.scPush);
newSeason=(old=>function(){const r=old.apply(this,arguments);try{twSync();if(G.twPend&&G.twPend.length)twFlush();}catch(e){}return r;})(newSeason);
/* menajer: izleme listesi */
ACTX.wlTog=el=>{const m=G.m;if(!m)return;m.wl=m.wl||[];const k=el.dataset.k,i=m.wl.findIndex(x=>x.k===k);if(i>=0){m.wl.splice(i,1);toast('İzleme listesinden çıkarıldı');}else{m.wl.push({k,id:el.dataset.id,d:G.s.day});toast('İzleme listesine eklendi');}save();
  if(!$('#modal').hidden&&el.closest('#modalCard'))showPCard(el.dataset.id,k);else render();};
showPCard=(old=>function(id,k){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m&&id!==G.club){const box=$('#modalCard .offer-btns');if(box){const inL=(G.m.wl||[]).some(x=>x.k===k);
      const wl=`<button class="btn" data-act="wlTog" data-id="${id}" data-k="${k}">${inL?'★ İzleme listesinde':'☆ İzleme listesine al'}</button>`;
      if(!trWin()){box.innerHTML=`<span class="tw-pill off">Transfer dönemi kapalı · ${esc(twNextTxt())}</span>${wl}`;}else box.insertAdjacentHTML('beforeend',wl);}}}catch(e){console.warn(e);}return r;})(showPCard);
trHTML=(old=>function(){let h=old.apply(this,arguments);try{const m=G.m,L=(m&&m.wl||[]).map(x=>{const p=pByKey(x.k);if(!p)return null;const cid=(G.tx&&G.tx[x.k])||p.home;return cid===G.club?null:{p,cid};}).filter(Boolean);
    if(m&&m.wl)m.wl=m.wl.filter(x=>L.some(y=>y.p.k===x.k));
    const wl=`<section class="panel"><p class="sub-h"><span>İzleme listesi</span><span>${L.length} oyuncu</span></p>${L.length?`<div class="trl">${L.map(({p,cid})=>{const c=CLUBS[cid],[lo,hi]=pPot(p),pr=(()=>{try{return Math.round(askPrice(p,cid).a*EUR_TL/1e4)*1e4;}catch(e){return Math.round(pValue(p)*EUR_TL*1.15/1e4)*1e4;}})();return `<button class="trrow" data-act="pcard" data-id="${cid}" data-k="${p.k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} · ${c?esc(c.short):''}</small></span><span class="to"><b>${R200(p.ovr)}</b><small>POT ${potTxt(lo,hi)}</small></span><span class="tv ${pr<=m.budget?'':'no'}">${money(pr)}</span></button>`;}).join('')}</div>`:'<p class="muted">Oyuncu kartından “İzleme listesine al” ile oyuncu ekleyebilirsin. Pencere açıldığında hatırlatılır.</p>'}</section>`;
    h=h.replace('<span class="pill good">Pencere açık</span>',twPill()).replace('<span class="pill">Pencere kapalı</span>',twPill());return wl+h;}catch(e){console.warn(e);return h;}})(trHTML);
/* takvimde transfer dönemi günleri */
viewCal=(old=>function(){let h=old.apply(this,arguments);try{const s=G.s,base=dateOf(s.day),mY=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+CALM,1)),y=mY.getUTCFullYear(),mo=mY.getUTCMonth(),start=dateOf(0).getTime();let d=0;
    h=h.replace(/<div class="cl-c(?! e")/g,m=>{d++;const di=Math.round((Date.UTC(y,mo,d)-start)/864e5);return twOpenAt(di)?'<div class="cl-c tw':m;});
    const I=twInfo();h=h.replace('<small class="muted">Ev simgesi',`<small class="muted"><i class="tw-key"></i> Mor alt çizgi: transfer dönemi (${esc(CC[twCC()]||'')} · yaz ${twD(I.so)}–${twD(I.sc)}, kış ${twD(I.wo)}–${twD(I.wc)}). Ev simgesi`);}catch(e){}return h;})(viewCal);

XV.cal=viewCal;
/* ---------- Avrupa kupaları: ŞL / AL / KL ---------- */
const EU_D={
  ucl:{md:[[8,9],[9,14],[9,21],[10,4],[10,25],[11,9],[0,20],[0,27]],po:[[1,17],[1,24]],r16:[[2,10],[2,17]],qf:[[3,7],[3,14]],sf:[[3,28],[4,5]],f:[5,5],venue:'Estadio Metropolitano, Madrid',
    pz:{start:18.62e6,w:2.1e6,d:0.7e6,po:1e6,r16:11e6,qf:12.5e6,sf:15e6,f:18.5e6,win:6.5e6}},
  uel:{md:[[8,17],[9,15],[9,22],[10,5],[10,26],[11,10],[0,21],[0,28]],po:[[1,18],[1,25]],r16:[[2,11],[2,18]],qf:[[3,8],[3,15]],sf:[[3,29],[4,6]],f:[4,26],venue:'Stadion Frankfurt, Frankfurt',
    pz:{start:4.31e6,w:0.45e6,d:0.15e6,po:0.3e6,r16:1.75e6,qf:3e6,sf:4.5e6,f:7e6,win:6e6}},
  uecl:{md:[[9,15],[9,22],[10,5],[10,26],[11,10],[11,17]],po:[[1,18],[1,25]],r16:[[2,11],[2,18]],qf:[[3,8],[3,15]],sf:[[3,29],[4,6]],f:[5,2],venue:'Beşiktaş Stadyumu, İstanbul',
    pz:{start:3.17e6,w:0.4e6,d:0.133e6,po:0.2e6,r16:0.8e6,qf:1.3e6,sf:2.5e6,f:4e6,win:3e6}}};
const KRK={'Play-off':'po','Son 16':'r16','Çeyrek Final':'qf','Yarı Final':'sf','Final':'f'},KRN={po:'Play-off',r16:'Son 16',qf:'Çeyrek Final',sf:'Yarı Final',f:'Final'};
const EUCC3={TR:'TUR',EN:'ENG',ES:'ESP',IT:'ITA',DE:'GER',FR:'FRA',PT:'POR',NL:'NED',BE:'BEL',SA:'KSA',BR:'BRA',SC:'SCO',GR:'GRE',AT:'AUT',CH:'SUI',DK:'DEN'};
const ccX=id=>CLUBS[id]?EUCC3[ccOf(CLUBS[id])]||ccOf(CLUBS[id]):(EXT[id]&&EXT[id].nat)||'?';
/* Avrupa havuzunu genişlet: gerçek kulüpler */
[['dkiev','Dinamo Kiev','DYN','#ffffff','#1d3f8f',72,'UKR'],['slovan','Slovan Bratislava','SLO','#79bde8','#ffffff',68,'SVK'],['rijeka','Rijeka','RIJ','#ffffff','#1d70b8',67,'CRO'],['hajduk','Hajduk Split','HAJ','#ffffff','#1d3f8f',67,'CRO'],
 ['partizan','Partizan','PAR','#111111','#ffffff',68,'SRB'],['rbk','Rosenborg','RBK','#ffffff','#111111',66,'NOR'],['brann','Brann','BRA','#d2122e','#ffffff',67,'NOR'],['hacken','BK Häcken','HAC','#ffd400','#111111',66,'SWE'],
 ['djurg','Djurgården','DIF','#79bde8','#1d3f8f',66,'SWE'],['jagiel','Jagiellonia','JAG','#ffd400','#d2122e',67,'POL'],['rakow','Raków','RAK','#d2122e','#1d3f8f',67,'POL'],['cfr','CFR Cluj','CFR','#7a1f2b','#ffffff',66,'ROU'],
 ['fcsb','FCSB','FCS','#d2122e','#1d3f8f',67,'ROU'],['shamrock','Shamrock Rovers','SHR','#007a3d','#ffffff',62,'IRL'],['omonia','Omonia','OMO','#007a3d','#ffffff',65,'CYP'],['apoel','APOEL','APO','#ffd400','#1d3f8f',65,'CYP'],
 ['pafos','Pafos','PAF','#1d3f8f','#ffffff',67,'CYP'],['celje','Celje','CEL','#ffd400','#1d3f8f',64,'SVN'],['mhaifa','Maccabi Haifa','MHA','#007a3d','#ffffff',67,'ISR'],['zrinj','Zrinjski','ZRI','#d2122e','#ffffff',61,'BIH'],
 ['sabah','Sabah','SAB','#1d3f8f','#ffffff',61,'AZE'],['astana','Astana','AST','#ffd400','#79bde8',62,'KAZ'],['kairat','Kairat','KAI','#ffd400','#111111',63,'KAZ'],['breida','Breiðablik','BRE','#007a3d','#ffffff',58,'ISL'],
 ['levski','Levski Sofya','LEV','#1d3f8f','#ffffff',63,'BUL'],['ucraiova','Universitatea Craiova','UCV','#003f87','#ffffff',63,'ROU'],['sigma','Sigma Olomouc','SIG','#1d70b8','#ffffff',62,'CZE'],['trnava','Spartak Trnava','TRN','#d2122e','#111111',62,'SVK'],
 ['hjk','HJK Helsinki','HJK','#1d3f8f','#ffffff',61,'FIN'],['kups','KuPS','KUP','#ffd400','#111111',60,'FIN'],['shelb','Shelbourne','SHE','#d2122e','#ffffff',59,'IRL'],['zalg','Žalgiris','ZAL','#007a3d','#ffffff',60,'LTU'],['rfs','RFS','RFS','#1d3f8f','#ffffff',59,'LVA'],
 ['shkend','Shkëndija','SHK','#d2122e','#111111',59,'MKD'],['noah','Noah','NOA','#111111','#ffd400',60,'ARM'],['drita','Drita','DRI','#1d3f8f','#ffffff',59,'KOS'],['lincoln','Lincoln Red Imps','LRI','#d2122e','#ffffff',55,'GIB']]
 .forEach(x=>{if(CLUBS[x[0]]||EXT[x[0]])return;EXT_DATA.push(x);const [id,name,short,c1,c2,str,nat]=x;EXT[id]={id,name,short,c1,c2,str,str0:str,nat,ext:true};});
/* katılımcılar: kupalar arası tekrar yok */
euParticipants=(old=>function(k,q){try{const own={ucl:q.ucl.slice(),uel:q.uel.slice(),uecl:q.uecl.slice()},used=new Set([...own.ucl,...own.uel,...own.uecl]);
    const ex=EXT_DATA.map(x=>x[0]).filter(x=>!CLUBS[x]&&EXT[x]&&!used.has(x)&&!EU_DUPN.has(euNorm(EXT[x].name))&&!EU_DUPN.has(EXT[x].short+'|'+EXT[x].nat)).sort((a,b)=>cupStr(b)-cupStr(a)),out={};
    for(const c of ['ucl','uel','uecl']){const need=Math.max(0,36-own[c].length);out[c]=own[c].concat(ex.splice(0,need));}
    let L=[...new Set(out[k])];if(L.length%2){const w=L.filter(x=>!q[k].includes(x)).sort((a,b)=>cupStr(a)-cupStr(b))[0]||L[L.length-1];L=L.filter(x=>x!==w);}return L;}catch(e){return old(k,q);}})(euParticipants);
const euNorm=n=>String(n).toLocaleLowerCase('tr-TR').replace(/^(fc|sk|ac|as|sc|rc|cf|bk|fk|afc|ssc)\s+|\s+(fc|sk|cp|fk|sc)$/g,'').replace(/[^a-zçğıöşüa-z0-9]/g,'');
const EU_DUPN=new Set([...Object.values(CLUBS).map(c=>euNorm(c.name)),...Object.values(CLUBS).map(c=>c.short+'|'+(EUCC3[ccOf(c)]||''))]);
let EUB_C={};
function euSeed(s){return srnd(s);}
function euBoard(id,force){if(!G||!G.s||!G.s.cal||G.phase==='tryout')return null;const cs=cupsOf(),k=(cs.list||[]).find(x=>x.id===id&&x.type==='eu'),Y=G.s.year;
  const q=G.qual&&G.qual.y===Y?G.qual:G.qualPrev&&G.qualPrev.y===Y?G.qualPrev:null;if(!k&&!q)return null;
  const key=[id,Y,G.s.day,G.phase,G.club,k?k.res.length+'/'+k.cur+'/'+k.alive+'/'+k.opp:'-',force||0].join('|');if(EUB_C[id]&&EUB_C[id].key===key)return EUB_C[id].B;
  let parts=[...new Set((k?k.parts:euParticipants(id,q)).filter(x=>clubObj(x)))];if(parts.length%2){const w=parts.filter(x=>x!==G.club).sort((a,b)=>cupStr(a)-cupStr(b))[0];parts=parts.filter(x=>x!==w);}
  const n=EUC[id].lp,D=EU_D[id],r=euSeed('eub'+id+Y),off=G.phase!=='season',dd=md=>dayOfDate(Y,md[0],md[1]);
  const lpRes=k?k.res.filter(x=>/Lig aşaması/.test(x.n)):[];
  const lpDay=i=>k&&k.rounds[i]&&k.rounds[i].lp?k.rounds[i].day:dd(D.md[i]);
  const koDay=(nm,leg)=>{if(k){const R=k.rounds.find(x=>x.n===nm&&(x.leg||0)===(leg||0));if(R&&R.day!=null)return R.day;}const kk=KRK[nm];return kk==='f'?dd(D.f):dd(D[kk][(leg||1)-1]);};
  const played=d=>force===true||off||d<G.s.day;
  /* lig aşaması eşleşmeleri */
  const met={},mk=(a,b)=>{(met[a]=met[a]||{})[b]=1;(met[b]=met[b]||{})[a]=1;},mds=[];
  for(let i=0;i<n;i++){let av=parts.slice();const M=[],day=lpDay(i);
    if(k&&k.lpOpps[i]&&av.includes(k.lpOpps[i])&&av.includes(G.club)){const o=k.lpOpps[i],h=!!(k.rounds[i]&&k.rounds[i].home);M.push({h:h?G.club:o,a:h?o:G.club,me:true});mk(G.club,o);av=av.filter(x=>x!==G.club&&x!==o);}
    av=av.map(x=>[x,r()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    while(av.length>1){const a=av.shift();let j=av.findIndex(b=>!(met[a]&&met[a][b])&&ccX(a)!==ccX(b));if(j<0)j=av.findIndex(b=>!(met[a]&&met[a][b]));if(j<0)j=0;const b=av.splice(j,1)[0];mk(a,b);M.push(r()<0.5?{h:a,a:b}:{h:b,a});}
    for(const m of M){const [lh,la]=lambdas(cupStr(m.h),cupStr(m.a));m.hg=sPois(lh,r);m.ag=sPois(la,r);m.pl=false;
      if(m.me){const x=lpRes[i];if(x){const us=x.us,th=x.them;if(m.h===G.club){m.hg=us;m.ag=th;}else{m.hg=th;m.ag=us;}m.pl=true;}}
      else m.pl=played(day)||force==='lp'||(day===G.s.day&&k&&lpRes.length>i);}
    mds.push({day,M});}
  /* tablo */
  const T={};parts.forEach(id2=>T[id2]={id:id2,o:0,g:0,b:0,m:0,a:0,y:0,p:0,aw:0,tb:r()});
  for(const md of mds)for(const m of md.M){if(!m.pl)continue;const H=T[m.h],A=T[m.a];H.o++;A.o++;H.a+=m.hg;H.y+=m.ag;A.a+=m.ag;A.y+=m.hg;A.aw+=m.ag;
    if(m.hg>m.ag){H.g++;H.p+=3;A.m++;}else if(m.hg<m.ag){A.g++;A.p+=3;H.m++;}else{H.b++;A.b++;H.p++;A.p++;}}
  const tbl=Object.values(T).sort((a,b)=>b.p-a.p||(b.a-b.y)-(a.a-a.y)||b.a-a.a||b.aw-a.aw||b.g-a.g||a.tb-b.tb);
  const lpDone=mds.every(md=>md.M.every(m=>m.pl));
  const B={id,k,parts,n,mds,tbl,lpDone,ko:{},champ:null,runner:null,Y};
  if(lpDone){const R=tbl.map(x=>x.id),seedOf=x=>R.indexOf(x);
    const myForced=nm=>{if(!k||k.eubAll||force)return null;const cr=k.rounds[k.cur];if(cr&&cr.n===nm&&k.alive)return k.opp;const rr=k.res.find(x=>x.n===nm);return rr?rr.opp:null;};
    const tie=(a,b,nm,j)=>{if(seedOf(b)<seedOf(a)&&nm!=='Final'){const t=a;a=b;b=t;}const rr=euSeed('eut'+id+Y+nm+j),fin=nm==='Final';
      const L1={h:fin?a:b,a:fin?b:a,day:koDay(nm,fin?0:1)},L2=fin?null:{h:a,a:b,day:koDay(nm,2)};
      const sim=L=>{const [lh,la]=lambdas(cupStr(L.h),cupStr(L.a));if(fin){const mm=(lh+la)/2,d=(lh-la)/2;L.hg=sPois(mm+d*0.8,rr);L.ag=sPois(mm-d*0.8,rr);}else{L.hg=sPois(lh,rr);L.ag=sPois(la,rr);}};
      sim(L1);if(L2)sim(L2);const pr=rr();let t={a,b,nm,j,L1,L2,me:a===G.club||b===G.club};
      if(t.me&&k){const rs=k.res.filter(x=>x.n===nm);[L1,L2].forEach((L,i)=>{if(!L)return;const x=rs.find(z=>(z.leg||0)===(fin?0:i+1))||(fin?rs[0]:null);L.pl=!!x;if(x){if(L.h===G.club){L.hg=x.us;L.ag=x.them;}else{L.hg=x.them;L.ag=x.us;}}});
        const done=fin?!!rs.length:rs.some(z=>z.leg===2);if(done){t.w=(fin?k.won:k.out!==nm)?G.club:(a===G.club?b:a);}else{const ag=aggOf(t);t.w=null;t.pw=ag[0]>=ag[1]?a:b;}t.pl=done;}
      else{L1.pl=played(L1.day);if(L2)L2.pl=played(L2.day);const ag=aggOf(t);if(ag[0]===ag[1]){t.pen=true;const pa=pr<0.5+(cupStr(a)-cupStr(b))*0.012;t.w=pa?a:b;const x=4+Math.floor(rr()*2),y=x-1-Math.floor(rr()*2);t.ps=pa?[x,Math.max(1,y)]:[Math.max(1,y),x];}else t.w=ag[0]>ag[1]?a:b;
        t.pl=(L2||L1).pl;}
      return t;};
    const aggOf=t=>{let x=0,y=0;for(const L of [t.L1,t.L2]){if(!L)continue;if(L.h===t.a){x+=L.hg;y+=L.ag;}else{x+=L.ag;y+=L.hg;}}return [x,y];};
    B.aggOf=aggOf;
    const win=t=>t.w||t.pw||t.a;
    /* takımımızın zorunlu rakibi (eski kayıtlar) */
    const fix=(ties,nm)=>{const fo=myForced(nm);if(!fo)return ties;const ti=ties.findIndex(t=>t.a===G.club||t.b===G.club);if(ti<0)return ties;const T0=ties[ti],cur=T0.a===G.club?T0.b:T0.a;if(cur===fo)return ties;
      const oi=ties.findIndex((t,i)=>i!==ti&&(t.a===fo||t.b===fo));if(oi>=0){const O=ties[oi];if(O.a===fo)O.a=cur;else O.b=cur;}if(T0.a===G.club)T0.b=fo;else T0.a=fo;return ties;};
    let pairs=[];for(let j=0;j<8;j++)if(R[8+j]&&R[23-j])pairs.push([R[8+j],R[23-j]]);
    const drawn=nm=>k&&k.alive&&k.rounds[k.cur]&&k.rounds[k.cur].n===nm;
    const build=(nm,ps,fd)=>{let tmp=ps.map(([a,b],j)=>({a,b}));tmp=fix(tmp,nm);return tmp.map((x,j)=>{const t=tie(x.a,x.b,nm,j),F=fd?fd(j):[];t.known=F.every(f=>!f||f.pl)||(t.me&&drawn(nm))||t.L1.pl;return t;});};
    B.ko.po=build('Play-off',pairs);
    const poW=B.ko.po.map(win);pairs=[];const r16F=[];for(let j=0;j<8;j++)if(R[j]){pairs.push([R[j],poW[7-j]||R[24+j]]);r16F.push([B.ko.po[7-j]]);}B.ko.r16=build('Son 16',pairs,j=>r16F[j]);
    const ORD=[0,7,3,4,1,6,2,5],r16W=B.ko.r16.map(win);pairs=[];const qfF=[];for(let t=0;t<4;t++){if(!(r16W[ORD[2*t]]&&r16W[ORD[2*t+1]]))continue;pairs.push([r16W[ORD[2*t]],r16W[ORD[2*t+1]]]);qfF.push([B.ko.r16[ORD[2*t]],B.ko.r16[ORD[2*t+1]]]);}B.ko.qf=build('Çeyrek Final',pairs,j=>qfF[j]);
    const qfW=B.ko.qf.map(win);B.ko.sf=build('Yarı Final',[[qfW[0],qfW[1]],[qfW[2],qfW[3]]].filter(p=>p[0]&&p[1]),j=>[B.ko.qf[2*j],B.ko.qf[2*j+1]]);
    const sfW=B.ko.sf.map(win);B.ko.f=build('Final',[[sfW[0],sfW[1]]].filter(p=>p[0]&&p[1]),()=>[B.ko.sf[0],B.ko.sf[1]]);
    const F=B.ko.f[0];if(F&&F.pl&&F.w){B.champ=F.w;B.runner=F.w===F.a?F.b:F.a;}}
  EUB_C[id]={key,B};return B;}
/* takımımız: sıralama, kura ve şampiyon tablodan */
lpRank=(old=>function(k){try{if(k&&k.type==='eu'&&EU_D[k.id]){const B=euBoard(k.id,'lp');if(B){const i=B.tbl.findIndex(x=>x.id===G.club);if(i>=0){k.table=B.tbl.slice(0,12).concat(i>=12?[B.tbl[i]]:[]).map(x=>({id:x.id,p:x.p,gd:x.a-x.y,r:Math.round((B.tbl.indexOf(x)+1)*k.parts.length/36)||1}));return i+1;}}}}catch(e){console.warn(e);}return old(k);})(lpRank);
euDraw=(old=>function(k){try{const nm=k.rounds[k.cur]&&k.rounds[k.cur].n;if(KRK[nm]){k.eubAll=true;delete EUB_C[k.id];const B=euBoard(k.id,false);const T=B&&B.ko[KRK[nm]];const t=T&&T.find(t=>t.a===G.club||t.b===G.club);if(t)return t.a===G.club?t.b:t.a;}}catch(e){console.warn(e);}return old(k);})(euDraw);
buildComps=(old=>function(){const R=old.apply(this,arguments);try{for(const k of R.list)if(k.type==='eu')k.eubAll=true;}catch(e){}return R;})(buildComps);
cupDecide=(old=>function(k){if(k.decided)return;try{if(k.type==='eu'&&EU_D[k.id]){const B=euBoard(k.id,true);if(B&&B.champ){k.decided=true;cupWin(k,B.champ,B.runner);const w=clubObj(B.champ),ru=clubObj(B.runner);
      msg('gundem',`${k.name} şampiyonu: ${w.name}`,`${EU_D[k.id].venue}'daki finalde ${w.name}, ${ru.name} karşısında kupayı kaldırdı.`);return;}}}catch(e){console.warn(e);}return old(k);})(cupDecide);
/* UEFA para ödülleri (menajer) */
cupApply=(old=>function(k,us,them,notes){if(!k||k.type!=='eu'||!EU_D[k.id])return old.apply(this,arguments);const r0=k.rounds[k.cur],n0=k.res.length,out=old.apply(this,arguments);
  try{const P=EU_D[k.id].pz;let a=0;const why=[];if(n0===0){a+=P.start;why.push('katılım');}
    if(r0&&r0.lp){if(us>them){a+=P.w;why.push('galibiyet');}else if(us===them){a+=P.d;why.push('beraberlik');}}
    const r1=k.rounds[k.cur];if(k.alive&&r1&&r1!==r0&&r1.n!==r0.n&&KRK[r1.n]&&!(r1.leg===2)){const kk=KRK[r1.n];if(P[kk]){a+=P[kk];why.push(r1.n+' bileti');}}
    if(k.won){a+=P.win;why.push('şampiyonluk');}
    k.prize=(k.prize||0)+a;if(a>0&&G.mode==='mgr'&&G.m){G.m.budget+=a*EUR_TL;notes.push(`UEFA ödemesi: ${eur(a)} (${why.join(', ')}). Transfer bütçesine eklendi.`);}}catch(e){console.warn(e);}
  return out;})(cupApply);
/* sezon sonu: bizim olmadığımız kupaların şampiyonları + kupa şampiyonlarının bilet hakları */
qualNext=(old=>function(){const W={};G.qualPrev=G.qual;try{const mine=(cupsOf().list||[]).filter(k=>k.type==='eu').map(k=>k.id);
    for(const id of ['ucl','uel','uecl']){const B=euBoard(id,true);if(!B||!B.champ)continue;W[id]=B.champ;if(!mine.includes(id)){const fk={type:'eu',id,name:EUC[id].name};cupWin(fk,B.champ,B.runner);
        msg('gundem',`${EUC[id].name} şampiyonu: ${clubObj(B.champ).name}`,`${EU_D[id].venue}'daki finalde ${clubObj(B.champ).name}, ${clubObj(B.runner).name} karşısında kupayı kaldırdı.`);}}}catch(e){console.warn(e);}
  const r=old.apply(this,arguments);
  try{const q=G.qual,mv=(id,to)=>{if(!id||!CLUBS[id]||!EU_SPOTS[CLUBS[id].league])return;const ord=['ucl','uel','uecl'];if(ord.indexOf(ord.find(c=>q[c].includes(id))||'x')>-1&&ord.indexOf(ord.find(c=>q[c].includes(id)))<=ord.indexOf(to))return;
      for(const c of ord)q[c]=q[c].filter(x=>x!==id);q[to].push(id);if(id===G.club)msg('news',`Kupa şampiyonu olarak ${EUC[to].name}`,`${myClub().name}, kazandığı Avrupa kupası sayesinde gelecek sezon ${EUC[to].name}’nde mücadele edecek.`);};
    mv(W.ucl,'ucl');mv(W.uel,'ucl');mv(W.uecl,'uel');}catch(e){console.warn(e);}EUB_C={};return r;})(qualNext);

/* ---------- Avrupa görünümü ---------- */
let EUTAB=null,EUMD=null;
const EU_RULES={
  ucl:['36 takım tek bir lig tablosunda yarışır (lig aşaması).','Her takım 8 farklı rakiple oynar: 4 iç saha, 4 deplasman. Kurada dört torbanın her birinden 2 rakip gelir; aynı ülkenin takımları lig aşamasında karşılaşmaz.'],
  uel:['36 takım tek bir lig tablosunda yarışır (lig aşaması).','Her takım 8 farklı rakiple oynar: 4 iç saha, 4 deplasman. Kurada dört torbanın her birinden 2 rakip gelir; aynı ülkenin takımları lig aşamasında karşılaşmaz.'],
  uecl:['36 takım tek bir lig tablosunda yarışır (lig aşaması).','Her takım 6 farklı rakiple oynar: 3 iç saha, 3 deplasman. Kurada altı torbanın her birinden 1 rakip gelir; aynı ülkenin takımları lig aşamasında karşılaşmaz.']};
function euRulesList(id){const D=EU_D[id],fd=dateOf(dayOfDate(G.s.year,D.f[0],D.f[1]));return EU_RULES[id].concat([
  'Sıralama ölçütleri: puan, averaj, atılan gol, deplasmanda atılan gol, galibiyet sayısı.',
  '1–8. sıradakiler doğrudan son 16’ya kalır. 9–24. sıradakiler çift maçlı eleme play-off’u oynar (9–16 seri başıdır, rövanşı evinde oynar). 25. ve sonrası elenir; alt kupaya düşme yoktur.',
  'Son 16, çeyrek final ve yarı final çift maçlıdır. Toplam skor eşitse uzatma, ardından penaltılar (oyunda doğrudan penaltı atışları). Deplasman golü kuralı yoktur.',
  `Final tek maç, tarafsız sahada: ${D.venue} · ${fmtDate(fd,true)}.`,
  'Kartlar: 3 sarı kart 1 maç ceza getirir; sarı kartlar çeyrek finalden sonra silinir. Kırmızı kart en az 1 maç cezadır.',
  'A listesi en çok 25 oyuncu; bunların en az 8’i yerel yetişmiş (4’ü kulüp yetiştirmesi) olmalı. Maçta 5 oyuncu değişikliği hakkı (3 duraklamada).',
  id==='ucl'?'Şampiyon, UEFA Süper Kupa’da Avrupa Ligi şampiyonuyla karşılaşır.':id==='uel'?'Şampiyon, gelecek sezon Şampiyonlar Ligi lig aşamasına katılır ve UEFA Süper Kupa’yı oynar.':'Şampiyon, daha üst bir kupaya katılmıyorsa gelecek sezon Avrupa Ligi’ne katılır.']);}
function euQuotaHTML(){const EUn=['ŞL','AL','KL'];return `<ul class="eu-quota">${Object.entries(EU_SPOTS).map(([lid,sp])=>`<li><span>${esc(LEAGUES[lid].short)}</span>${sp.map((x,i)=>x?`<i class="eq-${['ucl','uel','uecl'][i]}">${x} ${EUn[i]}</i>`:'').join('')}</li>`).join('')}</ul><p class="muted" style="margin:6px 0 0">Kontenjanlar oyundaki ülke sıralamasına göre. Ulusal kupa şampiyonu Avrupa Ligi’ne katılır.</p>`;}
const euNm=id=>{const c=clubObj(id);return c?c.name:'—';};
const euCr=(id,s)=>{const c=clubObj(id);return c?crestSVG(c,s||16):'';};
function euTieHTML(t,B){if(!t||!t.known)return `<div class="eu-tie e"><small>${t?`${twD(t.L1.day)} · önceki tur bekleniyor`:'Belli değil'}</small></div>`;const ag=B.aggOf(t),show=t.L1.pl,w=t.pl?t.w:null;
  const row=(id,x)=>`<div class="eu-tr ${w===id?'w':w?'l':''} ${id===G.club?'me':''}" ${CLUBS[id]?`data-act="club" data-id="${id}"`:''}>${euCr(id,14)}<span>${esc(euNm(id))}</span><b>${show?x:''}</b></div>`;
  const legs=t.L2?`${t.L1.pl?`${t.L1.hg}-${t.L1.ag}`:twD(t.L1.day)} · ${t.L2.pl?`${t.L2.hg}-${t.L2.ag}`:twD(t.L2.day)}`:(t.L1.pl?'Final':twD(t.L1.day));
  return `<div class="eu-tie">${row(t.a,ag[0])}${row(t.b,ag[1])}<small>${legs}${t.pl&&t.pen?` · pen. ${t.ps?t.ps.join('-'):''}`:''}</small></div>`;}
function euViewHTML(){if(!G||!G.s||!G.s.cal)return '';const cs=cupsOf(),mine=(cs.list||[]).filter(k=>k.type==='eu');const id=EUTAB&&EUC[EUTAB]?EUTAB:(mine[0]?mine[0].id:'ucl'),E=EUC[id],D=EU_D[id],B=euBoard(id);
  const chips=`<div class="filt eu-chips">${['ucl','uel','uecl'].map(c=>`<button class="chip" data-act="euTab" data-k="${c}" aria-pressed="${c===id}"><i class="eu-dot" style="background:${EUC[c].c}"></i>${EUC[c].name}</button>`).join('')}</div>`;
  if(!B)return chips+`<section class="panel"><p class="muted">Avrupa kupaları sezon başladığında oluşturulur.</p></section>`;
  const k=B.k,Y=G.s.year,fd=dateOf(dayOfDate(Y,D.f[0],D.f[1])),last=(G.cupW||[]).find(x=>x.c===E.name),pl=B.mds.filter(m=>m.M.every(x=>x.pl)).length;
  const stage=B.champ?`Şampiyon: ${euNm(B.champ)}`:!B.lpDone?`Lig aşaması · ${pl}/${B.n}. hafta`:['f','sf','qf','r16','po'].map(x=>B.ko[x]&&B.ko[x].length&&B.ko[x].some(t=>t.L1.pl)?KRN[x]:null).find(Boolean)||'Eleme turları başlıyor';
  const me=B.tbl.findIndex(x=>x.id===G.club);
  const meTxt=k?(k.won?'Kulübün şampiyon oldu!':!k.alive?(k.out?`Kulübün elendi (${esc(k.out)}).`:'Kulübün finalde kaybetti.'):`Kulübün bu kupada · ${me>=0?me+1+'. sıra':''}`):'Kulübün bu sezon bu kupada değil.';
  const head=`<section class="panel eu-hd" style="--euc:${E.c}"><div class="eu-logo">${E.short}</div><div class="eu-ht"><b>${esc(E.name)} · ${seasonLabel(Y)}</b><small>${esc(stage)} · Final: ${esc(D.venue)}, ${fmtDate(fd,true)}</small><small>${meTxt}${k&&k.prize?` · UEFA geliri ${eur(k.prize)}`:''}${last?` · Son şampiyon: ${esc(clubObj(last.w)?clubObj(last.w).name:'')} (${esc(last.y)})`:''}</small></div></section>`;
  const zone=i=>i<8?'eu-z1':i<24?'eu-z2':'eu-z3';
  const tbl=`<section class="panel"><p class="sub-h"><span>Lig aşaması</span><span>${B.tbl.length} takım</span></p><div class="tbl-wrap"><table class="lgt eut"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr></thead><tbody>${B.tbl.map((x,i)=>`<tr class="${zone(i)} ${x.id===G.club?'me':''} ${CLUBS[x.id]?'clk':''}" ${CLUBS[x.id]?`data-act="club" data-id="${x.id}"`:''}><td>${i+1}</td><td class="l club">${euCr(x.id,16)}<span>${esc(euNm(x.id))}</span>${flagImg(ccX(x.id),'fl-row')}</td><td>${x.o}</td><td>${x.g}</td><td>${x.b}</td><td>${x.m}</td><td>${x.a-x.y>0?'+':''}${x.a-x.y}</td><td class="pts">${x.p}</td></tr>`).join('')}</tbody></table></div>
    <div class="z-leg"><span><i class="eu-z1"></i>Son 16</span><span><i class="eu-z2"></i>Play-off</span><span><i class="eu-z3"></i>Elendi</span></div></section>`;
  let md=EUMD!=null&&EUMD<B.n?EUMD:Math.max(0,Math.min(B.n-1,pl-(pl>=B.n?1:0)));const MD=B.mds[md];
  const mdH=`<section class="panel"><p class="sub-h"><span>Maç günü ${md+1}</span><span>${fmtDate(dateOf(MD.day))}</span></p><div class="filt">${B.mds.map((_,i)=>`<button class="chip sm" data-act="euMd" data-k="${i}" aria-pressed="${i===md}">${i+1}</button>`).join('')}</div>
    <ul class="eu-res">${MD.M.map(m=>`<li class="${m.h===G.club||m.a===G.club?'me':''}"><span class="eh">${esc(euNm(m.h))}${euCr(m.h,14)}</span><b>${m.pl?`${m.hg} - ${m.ag}`:'v'}</b><span class="ea">${euCr(m.a,14)}${esc(euNm(m.a))}</span></li>`).join('')}</ul></section>`;
  const cols=['po','r16','qf','sf','f'],koH=B.lpDone?`<div class="eu-br">${cols.map(c=>{const L=B.ko[c]||[],N={po:8,r16:8,qf:4,sf:2,f:1}[c],O={po:[7,0,4,3,6,1,5,2],r16:[0,7,3,4,1,6,2,5]}[c];const arr=[];for(let i=0;i<N;i++)arr.push(L[O?O[i]:i]);return `<div class="eu-col"><p>${KRN[c]}</p>${arr.map(t=>euTieHTML(t,B)).join('')}</div>`;}).join('')}</div>`
    :`<p class="muted">Lig aşaması bitince (${fmtDate(dateOf(B.mds[B.n-1].day))}) eşleşmeler belli olur: 1–8 son 16’ya, 9–24 play-off’a.</p>`;
  const ko=`<section class="panel"><p class="sub-h"><span>Eleme turları</span><span>${B.champ?'🏆 '+esc(euNm(B.champ)):''}</span></p>${koH}</section>`;
  const P=D.pz,pz=`<ul class="cupres">${[['Katılım',P.start],['Lig aşaması galibiyet',P.w],['Beraberlik',P.d],['Play-off',P.po],['Son 16',P.r16],['Çeyrek final',P.qf],['Yarı final',P.sf],['Final',P.f],['Şampiyonluk bonusu',P.win]].map(([a,b])=>`<li><span>${a}</span><b>${eur(b)}</b></li>`).join('')}</ul>`;
  const trc=B.parts.filter(x=>CLUBS[x]&&ccOf(CLUBS[x])==='TR');
  const trH=trc.length?`<ul class="cupres">${trc.map(x=>{const i=B.tbl.findIndex(y=>y.id===x);let st=`${i+1}. sıra · ${B.tbl[i].p} puan`;if(B.lpDone){const outR=['po','r16','qf','sf','f'].find(c=>(B.ko[c]||[]).some(t=>t.pl&&(t.a===x||t.b===x)&&t.w!==x));st=B.champ===x?'Şampiyon':outR==='f'?'Finalist':outR?`${KRN[outR]} turunda elendi`:i>=24?'Lig aşamasında elendi':'Devam ediyor';}return `<li><span>${euCr(x,14)} ${esc(euNm(x))}</span><b>${st}</b></li>`;}).join('')}</ul>`:'<p class="muted">Bu sezon bu kupada Türk takımı yok.</p>';
  const past=(G.cupW||[]).filter(x=>x.c===E.name).slice(0,8),pastH=past.length?`<section class="panel"><p class="sub-h"><span>Geçmiş şampiyonlar</span></p><ul class="cupres">${past.map(x=>`<li><span>${esc(x.y)}</span><b>${esc(euNm(x.w))}</b><em>${x.r?esc(euNm(x.r)):''}</em></li>`).join('')}</ul></section>`:'';
  const rules=`<section class="panel"><p class="sub-h"><span>${esc(E.name)} kuralları</span></p><ul class="rules">${euRulesList(id).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="sub-h" style="margin-top:12px"><span>Lig kontenjanları</span></p>${euQuotaHTML()}</section>`;
  return `${chips}${head}<div class="eu-grid"><div>${tbl}</div><div>${mdH}<section class="panel"><p class="sub-h"><span>Türk temsilciler</span></p>${trH}</section><section class="panel"><p class="sub-h"><span>Para ödülleri (yaklaşık)</span></p>${pz}</section></div></div>${ko}<div class="eu-grid2">${rules}${pastH}</div>`;}
ACTX.euTab=el=>{EUTAB=el.dataset.k;EUMD=null;render();};
ACTX.euMd=el=>{EUMD=+el.dataset.k;render();};
viewLeague=(old=>function(){if(LTAB==='avr'){const lt=`<div class="filt">${[['tbl','Puan durumu'],['g','Gol krallığı'],['a','Asist krallığı'],['cup','Kupalar'],['avr','Avrupa'],['nk','Ulusal kupalar'],['kur','Kurallar']].map(([k,l])=>`<button class="chip" data-act="ltab" data-k="${k}" aria-pressed="${LTAB===k}">${l}</button>`).join('')}</div>`;
    return `<h2 class="h">Avrupa kupaları</h2>${lt}${euViewHTML()}`;}
  let h=old.apply(this,arguments);h=h.replace(/(<button class="chip" data-act="ltab" data-k="cup"[^>]*>Kupalar<\/button>)/,`$1<button class="chip" data-act="ltab" data-k="avr" aria-pressed="false">Avrupa</button>`);
  if(LTAB==='kur'){try{const lid=VLG||G.s.league,cc=LEAGUES[lid].cc;h=h.replace(/(<ul class="rules">[\s\S]*?)<\/ul>/,(m,a)=>a+`</ul><p class="sub-h" style="margin-top:12px"><span>Transfer dönemleri · ${esc(CC[cc]||'')}</span></p><ul class="cupres">${twRows(cc).map(([x,y])=>`<li><span>${x}</span><b>${y}</b></li>`).join('')}</ul><p class="muted" style="margin:6px 0 0">Pencere dışında transfer ve kiralama yapılamaz; serbest oyuncular her zaman imzalanabilir. Gözlem, analiz ve öneriler her zaman serbest.</p>`);}catch(e){}}
  return h;})(viewLeague);
XV.avr=()=>`<h2 class="h">Avrupa kupaları</h2>${euViewHTML()}`;
XICON.avr='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7l1.5 3 3.3.5-2.4 2.3.6 3.2L12 14.5 9 16l.6-3.2-2.4-2.3 3.3-.5z"/></svg>';
xtabs=(old=>function(){const L=old.apply(this,arguments);if(G&&G.phase!=='tryout'&&G.s&&G.s.cal){const i=L.findIndex(x=>x[0]==='cal');L.splice(i<0?L.length:i,0,['avr','Avrupa']);}return L;})(xtabs);

/* ---------- lig tablosu: masaüstü düzeni + form ---------- */
function formOf(id){const out=[];for(const rd of (G.s.results||[])){const r=rd&&rd.find(x=>x[0]===id||x[1]===id);if(!r)continue;const h=r[0]===id,u=h?r[2]:r[3],t=h?r[3]:r[2];out.push(u>t?'w':u===t?'d':'l');}return out.slice(-5);}
tableHTML=(old=>function(tb){let h=old.apply(this,arguments);try{h=h.replace('<table>','<table class="lgt">');const cur=tb[0]&&CLUBS[tb[0].id]&&CLUBS[tb[0].id].league===G.s.league;
    if(cur){h=h.replace('<th>P</th></tr>','<th>P</th><th class="frm">Form</th></tr>');h=h.replace(/data-id="([^"]+)"([\s\S]*?)<td class="pts">(\d+)<\/td><\/tr>/g,(m,id,mid,p)=>`data-id="${id}"${mid}<td class="pts">${p}</td><td class="frm">${formOf(id).map(x=>`<i class="fm-${x}">${x==='w'?'G':x==='d'?'B':'M'}</i>`).join('')}</td></tr>`);}}catch(e){console.warn(e);}return h;})(tableHTML);

/* gözlemci: pencere bekleyen transferler + ana ekranda pencere durumu */
if(typeof scTransfersHTML==='function')scTransfersHTML=(old=>function(){const h=old.apply(this,arguments),L=(G.twPend||[]).map(x=>pByKey(x.k)).filter(Boolean);
  return (L.length?`<section class="panel"><p class="sub-h"><span>Pencere bekleyenler</span><span>${esc(twNextTxt())}</span></p><ul class="cupres">${L.map(p=>`<li class="clk" data-act="pcard" data-id="${p.home}" data-k="${p.k}"><span>${dpTag(p)}</span><b>${esc(p.name)}</b><em>beklemede</em></li>`).join('')}</ul></section>`:'')+h;})(scTransfersHTML);
render=(old=>function(){const r=old.apply(this,arguments);try{if(TAB==='hub'&&G&&G.s&&G.s.cal&&G.phase==='season'&&!document.querySelector('#view .tw-bar')){const host=document.querySelector('#view .hub-l')||document.querySelector('#view');
    if(host){const pend=(G.twPend||[]).length;host.insertAdjacentHTML('afterbegin',`<div class="tw-bar">${twPill()}${pend?`<span class="tw-pend">${pend} transfer pencereyi bekliyor</span>`:''}<span class="tw-kur" title="Güncel kur (${KUR.d})">1 € = ${dec(KUR.eur,2)} ₺</span></div>`);}}}catch(e){}return r;})(render);

