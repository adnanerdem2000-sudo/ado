const LK_H=['bald','buzz','short','crop','quiff','medium','long','curly','afro','dread','braids','bun','mohawk'],LK_C=['#120b07','#2b1a10','#4a2f18','#c9a35e','#9a4a22','#b9b9b9','#e8d27a'],LK_B=[null,'stub','short','full'],LK_S=[[0,1],[2],[3],[4,5],[6],[7,8]];
const LKC2={};
lookOf=(old=>function(seed,nat,age,coach){const ck=seed+'|'+age+'|'+(coach?1:0);if(LKC2[ck])return LKC2[ck];const L=Object.assign({},old(seed,nat,age,coach)),r=srng(seed+'lk2');r();r();
  let p=null;try{p=!coach&&typeof pRaw==='function'?pRaw(seed):null;}catch(e){}const D=p&&LOOKS[p.name];
  if(D){const [h,s,hi,ci,bi]=D,ix=LK_S[clamp(s,1,6)-1];L.sk=SKN[ix[Math.floor(r()*ix.length)]];let hs=LK_H[hi]||'short';
    if(hs==='short'){hs=s>=5?['buzz','fade','short','curlytop','buzz'][Math.floor(r()*5)]:['short','side','fade','textured','crop','quiff'][Math.floor(r()*6)];}
    L.hs=hs;let hc=LK_C[ci]||LK_C[0];const grey=age>=34?0.12:0;L.hc=grey?mixC(hc,'#d9d9d9',grey):hc;L.bd=LK_B[bi]||null;L.hgt=clamp(h/181,0.9,1.12);L.cm=h;}
  else if(!coach&&(L.hs==='short'||L.hs==='side')&&r()<0.5)L.hs=['crop','quiff','textured','medium'][Math.floor(r()*4)];
  L.fs=Math.floor(r()*4);L.nose=Math.floor(r()*3);L.brw=2+r()*1.2;L.btl=(r()-0.5)*2.4;L.eyz=0.88+r()*0.26;L.mth=Math.floor(r()*3);L.earw=2.6+r()*0.9;L.chin=r()<0.25;L.frk=!coach&&r()<0.12;L.hb=!coach&&(L.hs==='long'||L.hs==='medium'||L.hs==='bun')&&r()<0.3;
  return LKC2[ck]=L;})(lookOf);
pMetaX=(old=>function(p){const M=old(p),D=p&&LOOKS[p.name];if(D)M.h=D[0];return M;})(pMetaX);
/* v172: v29'un saç ve yüz çizimi (hairSVG/faceSVG) kaldırıldı — 185_v159 yüzü tamamen yeniden çiziyor. */
/* ---------- gözlemci: reddedilen talepte yönetime baskı ---------- */
ACTX.scPush=el=>{const j=stG(),k=el.dataset.k,r=(j.rq||[]).find(x=>x.k===k&&x.st==='red'&&!x.push);if(!r)return;const p=pByKey(k);if(!p)return;r.push=1;
  const my=myClub(),B=Math.max(150000,clubBudget(my)*0.12*VALF/EUR_TL),price=pValue(p),bud=/bütçe/.test(r.why||''),gap=Math.max(0,(price-B)/B),n=(j.pushN||0);j.pushN=n+1;
  let ch=bud?clamp(0.82-gap*3.4,0,0.82):0.22;ch+=(j.bd-50)/220+(j.rep-40)/320+(r.rep&&r.rep.acc>=70?0.08:r.rep&&r.rep.acc<45?-0.1:0)-n*0.08;ch=clamp(ch,0.02,0.88);
  if(Math.random()<ch){const cid=scCid(p),sc=CLUBS[cid],role=squadRoles(cid)[p.k];stBoard(-1.5);
    if((role==='Yıldız'||role==='Kaptan')&&Math.random()<0.35){r.st='basarisiz';r.why=`yönetim ikna oldu ama ${sc.short} oyuncuyu satmaya yanaşmadı`;msg('board','Baskı işe yaradı ama...',`${p.name}: ${r.why}.`);save();render();return;}
    G.tx=G.tx||{};G.tx[p.k]=G.club;txNote(p.k,G.club,typeof price==='number'&&price<1e10?price:undefined);syncStr(G.club);syncStr(cid);j.kn[p.k]=4;r.st='tamam';r.real=p.ovr;r.why=bud?`zorlu bir pazarlıkla bütçenin ${eur(Math.max(0,price-B))} üstüne çıkıldı`:'ısrarın sonucu yönetim onay verdi';const diff=p.ovr-r.est;j.rqOk=(j.rqOk||0)+1;
    j.rep=clamp(j.rep+(diff>=-2?3:-4),0,100);if(diff>=-2)stBoard(2);else stBoard(-4);netXP(8);
    msg('board','Baskın sonuç verdi',`Yönetim ısrarın üzerine ${p.name} transferini onayladı${bud?` (bütçe ${eur(Math.max(0,price-B))} aşıldı)`:''}. Oyuncu ${eur(price)} bedelle ${sc.short} kulübünden kadromuza katıldı. Artık bu transferin sorumluluğu sende.`);toast('Yönetim ikna oldu');}
  else{stBoard(bud&&gap<0.2?-3:-5);j.rep=clamp(j.rep-2,0,100);msg('board','Baskın ters tepti',`Yönetim ${p.name} için ısrarını kabul etmedi${bud?`: bütçe farkı (${eur(Math.max(0,price-B))}) kulübün imkânlarını zorluyor`:''}. Kurul üyeleri bu tavrından rahatsız.`);toast('Yönetim baskını reddetti');}
  save();render();};

