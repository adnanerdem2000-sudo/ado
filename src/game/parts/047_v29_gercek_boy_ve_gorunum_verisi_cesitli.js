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
hairSVG=(old=>function(L,front){const f=L.fw,hc=L.hc,a=50-f,b=50+f,cap=`M${a} 41 Q${a-1} 17 50 17 Q${b+1} 17 ${b} 41 Q${b-3} 27 50 26 Q${a+3} 27 ${a} 41Z`;
  if(!front){if(L.hs==='medium')return `<path d="M${a-2} 40 Q${a-3} 15 50 15 Q${b+3} 15 ${b+2} 40 L${b+2} 54 Q${b-3} 52 ${b-3} 46 L${a+3} 46 Q${a+3} 52 ${a-2} 54Z" fill="${hc}"/>`;if(L.hs==='braids')return '';return old(L,front);}
  switch(L.hs){
    case 'crop':return `<path d="${cap}" fill="${hc}"/><path d="M${a+2} 31 L${a+6} 35 L${a+9} 30.5 L${a+13} 34.5 L${a+16} 30 L50 34 L${b-16} 30 L${b-13} 34.5 L${b-9} 30.5 L${b-6} 35 L${b-2} 31 Q50 23 ${a+2} 31Z" fill="${hc}"/>`;
    case 'quiff':return `<path d="${cap}" fill="${hc}" opacity=".7"/><path d="M${a+1} 33 Q${a+2} 12 ${50-2} 10 Q${b+2} 9 ${b-1} 30 Q${b-6} 22 50 22 Q${a+7} 24 ${a+1} 33Z" fill="${hc}"/>`;
    case 'textured':return `<path d="${cap}" fill="${hc}"/><g stroke="${shade(hc,0.35)}" stroke-width="1" opacity=".55">${[0,1,2,3,4].map(i=>`<path d="M${a+5+i*5} 22 l2 6"/>`).join('')}</g>`;
    case 'medium':return `<path d="M${a} 42 Q${a-2} 15 52 14.5 Q${b+3} 16 ${b} 42 Q${b-2} 26 56 25 Q44 32 ${a+1} 33Z" fill="${hc}"/>${L.hb?`<path d="M${a-1} 30 Q50 22 ${b+1} 30" stroke="${L.hbc||'#f4f4f4'}" stroke-width="3" fill="none"/>`:''}`;
    case 'braids':return `<path d="${cap}" fill="${hc}"/><g stroke="${shade(hc,0.6)}" stroke-width=".9" opacity=".6">${[-8,-4,0,4,8].map(i=>`<path d="M${50+i} 19 Q${50+i*1.15} 26 ${50+i*1.3} 33"/>`).join('')}</g>`;
    case 'curlytop':{const pts=[[42,21],[47,18],[53,18],[58,21],[45,24],[55,24],[50,21]];return `<path d="${cap}" fill="${hc}" opacity=".45"/><g fill="${hc}">${pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.4"/>`).join('')}</g>`;}
    case 'long':if(L.hb)return old(L,front)+`<path d="M${a-1} 30 Q50 22 ${b+1} 30" stroke="#f4f4f4" stroke-width="3" fill="none"/>`;return old(L,front);
    default:return old(L,front);}})(hairSVG);
faceSVG=function(L,o){const sk=L.sk,sh=shade(sk,-0.17),dk=shade(sk,-0.42),hc=L.hc,f=L.fw;o=o||{};const fs=L.fs||0,ez=L.eyz||1;
  const body=o.coach?`<path d="M8 112 C10 86 22 76 37 72 L50 84 L63 72 C78 76 90 86 92 112Z" fill="${L.suit}"/><path d="M41 72 L50 92 L59 72Z" fill="#f4f4f4"/><path d="M48 77 L52 77 L54 99 L50 104 L46 99Z" fill="${o.c1||'#8a1d1d'}"/><path d="M37 72 L47 98 L42 79Z M63 72 L53 98 L58 79Z" fill="rgba(255,255,255,.09)"/>`
    :`<path d="M10 112 C12 86 24 76 38 72 L50 80 L62 72 C76 76 88 86 90 112 Z" fill="${o.c1}" stroke="${o.c2}" stroke-width="3"/><path d="M38 72 L50 86 L62 72" fill="none" stroke="${o.c2}" stroke-width="4"/>${o.capt?'<path d="M14 92 L26 88 L28 95 L16 99Z" fill="#ffd21f"/>':''}`;
  const ry=[22,20.5,23.6,21.5][fs],rx=[f,f+1.2,f-0.9,f+0.4][fs];
  const head=fs===3?`<path d="M${50-rx} 36 Q${50-rx} 20 50 20 Q${50+rx} 20 ${50+rx} 36 L${50+rx-0.5} 50 Q${50+rx-2} 61 ${50+5} 63.5 L${50-5} 63.5 Q${50-rx+2} 61 ${50-rx+0.5} 50Z" fill="${sk}"/>`:`<ellipse cx="50" cy="42" rx="${rx}" ry="${ry}" fill="${sk}"/>`;
  let beard='';const fb=rx;if(L.bd==='stub')beard=`<path d="M${50-fb+1} 46 Q${50-fb+3} 63 50 65 Q${50+fb-3} 63 ${50+fb-1} 46 Q${50+fb-4} 59 50 60 Q${50-fb+4} 59 ${50-fb+1} 46Z" fill="${hc}" opacity=".32"/>`;
  else if(L.bd==='short')beard=`<path d="M${50-fb+1} 46 Q${50-fb+2.5} 64 50 65.5 Q${50+fb-2.5} 64 ${50+fb-1} 46 Q${50+fb-4} 58.5 50 59 Q${50-fb+4} 58.5 ${50-fb+1} 46Z" fill="${hc}" opacity=".68"/>`;
  else if(L.bd==='full')beard=`<path d="M${50-fb+0.5} 44 Q${50-fb+2} 66 50 67 Q${50+fb-2} 66 ${50+fb-0.5} 44 Q${50+fb-4} 58 50 58.5 Q${50-fb+4} 58 ${50-fb+0.5} 44Z" fill="${hc}" opacity=".92"/>`;
  else if(L.bd==='goatee')beard=`<ellipse cx="50" cy="61" rx="5" ry="4" fill="${hc}" opacity=".9"/>`;
  const mus=(L.bd==='full'||L.bd==='goatee'||L.bd==='mus'||L.bd==='short')?`<path d="M43.5 53 Q50 50.2 56.5 53 Q50 55 43.5 53Z" fill="${hc}" opacity="${L.bd==='short'?.75:1}"/>`:'';
  const wr=o.coach&&o.age>=52?`<path d="M42 31 Q50 29.5 58 31 M43.5 34 Q50 32.8 56.5 34" stroke="${sh}" stroke-width="1" fill="none"/>`:'';
  const gl=L.gl?`<g fill="rgba(200,220,255,.12)" stroke="#1d1d1d" stroke-width="1.4"><rect x="37.5" y="40.2" width="10" height="7.6" rx="2.4"/><rect x="52.5" y="40.2" width="10" height="7.6" rx="2.4"/><path d="M47.5 43 L52.5 43" fill="none"/></g>`:'';
  const brow=L.hs==='bald'&&!o.coach?dk:shade(hc,hc==='#c9a35e'||hc.startsWith('#d')||hc.startsWith('#e')?-0.3:0),bw=L.brw||2.5,bt=L.btl||0;
  const nose=[`<path d="M48.5 46.5 Q50 51 52 49.5" stroke="${sh}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,`<path d="M47 50 Q50 52.2 53 50" stroke="${sh}" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="47.6" cy="49.6" r=".9" fill="${dk}" opacity=".5"/><circle cx="52.4" cy="49.6" r=".9" fill="${dk}" opacity=".5"/>`,`<path d="M50 42 L48.6 49.5 Q50 51 51.8 50" stroke="${sh}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`][L.nose||0];
  const mouth=[`<path d="M44 55.6 Q50 ${o.coach?57.6:58.6} 56 55.6" stroke="${dk}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`,`<path d="M44.5 56.2 L55.5 56.2" stroke="${dk}" stroke-width="1.9" stroke-linecap="round"/>`,`<path d="M44 55.4 Q50 60 56 55.4 Q50 57.2 44 55.4Z" fill="#fff" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`][L.mth||0];
  const ew=L.earw||3.1,ey=44+(fs===2?0.6:0);
  return `<svg viewBox="0 0 100 112" width="78" height="88" aria-hidden="true">${hairSVG(L,false)}${body}
  <rect x="42.5" y="56" width="15" height="18" rx="6" fill="${sh}"/>
  <ellipse cx="${50-rx-0.6}" cy="45" rx="${ew}" ry="5" fill="${sh}"/><ellipse cx="${50+rx+0.6}" cy="45" rx="${ew}" ry="5" fill="${sh}"/>
  ${head}<path d="M${50+rx*0.35} 22 Q${50+rx+1} 30 ${50+rx-1} 52 Q${50+rx*0.6} 62 50 64 Q${50+rx*0.55} 50 ${50+rx*0.35} 22Z" fill="#000" opacity=".06"/>
  ${L.frk?`<g fill="${dk}" opacity=".35"><circle cx="40" cy="49" r=".7"/><circle cx="42.5" cy="50.5" r=".6"/><circle cx="58" cy="49" r=".7"/><circle cx="60" cy="50.6" r=".6"/></g>`:''}${L.chin?`<path d="M49.2 62.5 Q50 63.6 50.8 62.5" stroke="${sh}" stroke-width="1" fill="none"/>`:''}
  ${beard}${hairSVG(L,true)}${wr}
  <path d="M38.5 ${38.5+bt*0.3} L46 ${37.6-bt*0.3}" stroke="${brow}" stroke-width="${bw}" stroke-linecap="round"/><path d="M54 ${37.6-bt*0.3} L61.5 ${38.5+bt*0.3}" stroke="${brow}" stroke-width="${bw}" stroke-linecap="round"/>
  <ellipse cx="42.5" cy="${ey}" rx="${2.6*ez}" ry="${2.2*ez}" fill="#fff" opacity=".85"/><ellipse cx="57.5" cy="${ey}" rx="${2.6*ez}" ry="${2.2*ez}" fill="#fff" opacity=".85"/><circle cx="42.8" cy="${ey+0.2}" r="${1.7*ez}" fill="${L.ey}"/><circle cx="57.8" cy="${ey+0.2}" r="${1.7*ez}" fill="${L.ey}"/>
  ${nose}${mus}${mouth}${gl}
  ${o.num!=null&&!o.coach?`<text x="50" y="106" text-anchor="middle" font-family="Saira Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="19" fill="${o.c2}">${o.num}</text>`:''}</svg>`;};
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

