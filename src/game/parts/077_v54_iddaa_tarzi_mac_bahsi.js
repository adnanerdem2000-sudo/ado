/* ================= v54: iddaa tarzı maç bahsi ================= */
const IB_MK=[['ms','Maç Sonucu',[['1','MS 1'],['X','MS X'],['2','MS 2']]],['cs','Çifte Şans',[['1X','1-X'],['12','1-2'],['X2','X-2']]],['kg','Karşılıklı Gol',[['var','KG Var'],['yok','KG Yok']]],
  ['au15','1,5 Alt/Üst',[['alt','1,5 Alt'],['ust','1,5 Üst']]],['au25','2,5 Alt/Üst',[['alt','2,5 Alt'],['ust','2,5 Üst']]],['au35','3,5 Alt/Üst',[['alt','3,5 Alt'],['ust','3,5 Üst']]],
  ['tg','Toplam Gol',[['01','0-1 Gol'],['23','2-3 Gol'],['45','4-5 Gol'],['6p','6+ Gol']]],['tc','Tek/Çift',[['tek','Tek'],['cift','Çift']]],['hnd','Handikap (0:1)',[['1','H 1'],['X','H X'],['2','H 2']]],
  ['msau','MS + 2,5 A/Ü',[['1a','1 & Alt'],['1u','1 & Üst'],['Xa','X & Alt'],['Xu','X & Üst'],['2a','2 & Alt'],['2u','2 & Üst']]],['sk','Skor',[]]];
const IB_MKN=Object.fromEntries(IB_MK.map(m=>[m[0],m[1]]));
function ibWin(mk,sel,h,a){const t=h+a,r=h>a?'1':h===a?'X':'2';switch(mk){
  case 'ms':return sel===r;case 'cs':return sel.includes(r);case 'kg':return (h>0&&a>0)===(sel==='var');
  case 'au15':return (t>1.5)===(sel==='ust');case 'au25':return (t>2.5)===(sel==='ust');case 'au35':return (t>3.5)===(sel==='ust');
  case 'tg':return sel==='01'?t<=1:sel==='23'?t>=2&&t<=3:sel==='45'?t>=4&&t<=5:t>=6;case 'tc':return (t%2===1)===(sel==='tek');
  case 'hnd':{const hh=h-1;return sel===(hh>a?'1':hh===a?'X':'2');}case 'msau':return sel[0]===r&&(sel[1]==='u')===(t>2.5);
  case 'sk':return sel===`${h}-${a}`;}return false;}
const IB_OC={};
function ibMatrix(h,a){const k=h+'|'+a+'|'+CLUBS[h].str+'|'+CLUBS[a].str;if(IB_OC[k])return IB_OC[k];const [lh,la]=lambdas(CLUBS[h].str,CLUBS[a].str);const P=(l,n)=>{let f=1;for(let i=2;i<=n;i++)f*=i;return Math.exp(-l)*Math.pow(l,n)/f;};
  const M=[];let s=0;for(let i=0;i<=9;i++){M[i]=[];for(let j=0;j<=9;j++){M[i][j]=P(lh,i)*P(la,j);s+=M[i][j];}}for(let i=0;i<=9;i++)for(let j=0;j<=9;j++)M[i][j]/=s;return IB_OC[k]=M;}
function ibProb(M,mk,sel){let p=0;for(let i=0;i<=9;i++)for(let j=0;j<=9;j++)if(ibWin(mk,sel,i,j))p+=M[i][j];return p;}
function ibOdd(h,a,mk,sel){const p=ibProb(ibMatrix(h,a),mk,sel),mg=mk==='sk'?0.82:mk==='msau'||mk==='tg'?0.88:0.92;return Math.max(1.01,Math.min(mk==='sk'?150:60,Math.floor(mg/Math.max(p,0.004)*100)/100));}
function ibScores(h,a){const M=ibMatrix(h,a),L=[];for(let i=0;i<=5;i++)for(let j=0;j<=5;j++)L.push([`${i}-${j}`,M[i][j]]);return L.sort((x,y)=>y[1]-x[1]).slice(0,12).map(x=>x[0]).sort((x,y)=>{const [a1,b1]=x.split('-').map(Number),[a2,b2]=y.split('-').map(Number);return (a1-b1>0?0:a1===b1?1:2)-(a2-b2>0?0:a2===b2?1:2)||a1+b1-a2-b2;});}
/* lig ve hafta bulma */
function ibLeagues(){const S=G.s;if(!S)return [];const trL=Object.keys(LEAGUES).filter(l=>LEAGUES[l].cc==='TR'&&!LEAGUES[l].youth&&LEAGUES[l].tier>=6).sort((x,y)=>LEAGUES[y].tier-LEAGUES[x].tier);const top=[...trL,'sl','pl','ll','it1','de1','fr1','pt1','nl1','be1','sc1','gr1','at1','ch1','dk1','sa1','br1','en2','es2','it2','de2','fr2'];const L=[S.league,...top].filter((x,i,a)=>x&&a.indexOf(x)===i&&LEAGUES[x]&&!LEAGUES[x].youth&&leagueClubs(x).length>=4);return L;}
function ibRound(lid,off){const S=G.s;if(lid===S.league){const w=S.results.length+off;const fx=S.fixtures[w];return fx?{w,day:S.cal[w],fx}:null;}const o=olSync(lid);const w=o.res.length+off;const fx=o.fx[w];return fx?{w,day:o.cal[w],fx}:null;}
function ibCanBet(){return G&&G.s&&G.phase==='season';}
/* durum */
function ibS(){CZ.ib=CZ.ib||{lid:null,off:0,open:{},slip:[],amt:100,tab:'mb'};const I=CZ.ib;if(!I.lid||!ibLeagues().includes(I.lid))I.lid=G.s.league;return I;}
const ibKey=(lid,w,h,a)=>`${lid}|${w}|${h}|${a}`;
CZA.ibLg=el=>{const I=ibS();I.lid=el.dataset.v;I.off=0;czRender();};
CZA.ibWk=el=>{ibS().off=+el.dataset.v;czRender();};
CZA.ibTab=el=>{ibS().tab=el.dataset.v;czRender();};
CZA.ibOpen=el=>{const I=ibS(),k=el.dataset.k;I.open[k]=!I.open[k];czRender();};
CZA.ibPick=el=>{const I=ibS(),[lid,w,h,a]=el.dataset.k.split('|'),mk=el.dataset.m,sel=el.dataset.s;const ex=I.slip.findIndex(x=>x.k===el.dataset.k);
  if(ex>=0&&I.slip[ex].mk===mk&&I.slip[ex].sel===sel){I.slip.splice(ex,1);return czRender();}
  if(ex<0&&I.slip.length>=10)return czMsg('Bir kuponda en fazla 10 maç olabilir');const o=ibOdd(h,a,mk,sel),lab=(IB_MK.find(m=>m[0]===mk)[2].find(x=>x[0]===sel)||[sel,sel])[1];
  const it={k:el.dataset.k,lid,w:+w,h,a,mk,sel,o,lab:mk==='sk'?'Skor '+sel:lab};if(ex>=0)I.slip[ex]=it;else I.slip.push(it);czRender();};
CZA.ibRm=el=>{const I=ibS();I.slip.splice(+el.dataset.i,1);czRender();};
CZA.ibClr=()=>{ibS().slip=[];czRender();};
CZA.ibAmt=el=>{ibS().amt=+el.dataset.v;czRender();};
document.addEventListener('input',e=>{if(e.target&&e.target.id==='ibAmtIn'){const v=Math.round(+e.target.value);if(v>0){ibS().amt=v;const t=document.getElementById('ibWin');const I=ibS();if(t)t.textContent=eur(Math.round(v*I.slip.reduce((a,x)=>a*x.o,1)));}}});
CZA.ibPlay=()=>{const I=ibS(),g=czG();if(!I.slip.length)return czMsg('Kupona maç ekle');if(!ibCanBet())return czMsg('Sezon dışında bahis yapılamaz');const amt=Math.max(2,Math.round(I.amt||0));
  const sel=I.slip.map(x=>Object.assign({},x));const o=Math.round(sel.reduce((a,x)=>a*x.o,1)*100)/100;if(!gbPay(amt))return czMsg(`Nakit paran yetmiyor (kupon ${eur(amt)})`);gbHeat(5+sel.length);
  let pc=1,own=false;for(const s of sel){const ow=s.h===G.club||s.a===G.club;own=own||ow;pc*=1-(ow?0.35:s.lid===G.s.league?0.14:0.06)*(1+g.caught*0.5);}
  I.slip=[];if(Math.random()<1-pc){czClose();betCaught(own);return;}
  const id=Date.now()%1e9;g.cps.push({id,sel,o,amt,d:G.s.day,y:G.s.year,v2:1});save();czMsg(`Kupon oynandı · ${sel.length} maç · oran ${o.toFixed(2)} · olası kazanç ${eur(Math.round(amt*o))}`);I.tab='kp';czRender();};
/* sonuçlandırma */
function ibResult(b){const S=G.s;let rd=null;if(b.lid===S.league)rd=S.results[b.w];else if(LEAGUES[b.lid]){const o=olSync(b.lid);rd=o&&o.res[b.w];}const r=rd&&rd.find(x=>x[0]===b.h&&x[1]===b.a);return r?[r[2],r[3]]:null;}
cpSettle=function(){const g=czG(),S=G.s;if(!g.cps.length||!S)return;g.cpH=g.cpH||[];const keep=[];
  for(const c of g.cps){let lost=false,pend=false;for(const b of c.sel){const mk=b.mk||'ms',sel=b.mk?b.sel:['1','X','2'][b.sel];const r=ibResult(b);if(!r){pend=true;b.st=b.st||'bek';continue;}b.sc=r.join('-');b.st=ibWin(mk,sel,r[0],r[1])?'ok':'x';if(b.st==='x')lost=true;}
    if(!lost&&pend){if(G.phase!=='off')keep.push(c);else{c.res='iptal';gbWin(c.amt);g.cpH.unshift(c);}continue;}
    if(lost){c.res='kaybetti';g.lost+=c.amt;msg('event','Kupon yattı',`${c.sel.length} maçlık kuponun tutmadı (${eur(c.amt)}).`);}
    else{const p=Math.round(c.amt*c.o);c.res='kazandı';c.pay=p;gbWin(p);g.won+=p-c.amt;msg('event','KUPON TUTTU!',`${c.sel.length} maçlık kuponun tuttu: ${eur(c.amt)} → ${eur(p)} (oran ${c.o.toFixed?c.o.toFixed(2):c.o}).`);}
    g.cpH.unshift(c);}
  g.cps=keep;if(g.cpH.length>25)g.cpH.length=25;};
/* arayüz */
function ibMatchRow(lid,w,h,a,day){const I=ibS(),k=ibKey(lid,w,h,a),pk=I.slip.find(x=>x.k===k),own=h===G.club||a===G.club;
  const btn=(mk,sel,lab)=>{const o=ibOdd(h,a,mk,sel),on=pk&&pk.mk===mk&&pk.sel===sel;return `<button class="ib-o ${on?'on':''}" data-cz="ibPick" data-k="${k}" data-m="${mk}" data-s="${sel}"><small>${lab}</small><b>${o.toFixed(2)}</b></button>`;};
  const quick=btn('ms','1','1')+btn('ms','X','X')+btn('ms','2','2')+btn('au25','alt','2,5A')+btn('au25','ust','2,5Ü')+btn('kg','var','KG V')+btn('kg','yok','KG Y');
  const more=I.open[k]?`<div class="ib-more">${IB_MK.filter(m=>!['ms'].includes(m[0])).map(([mk,n,opts])=>{const L=mk==='sk'?ibScores(h,a).map(s=>[s,s]):opts;return `<div class="ib-mk"><p>${n}</p><div>${L.map(([s,l])=>btn(mk,s,l)).join('')}</div></div>`;}).join('')}</div>`:'';
  return `<div class="ib-row ${own?'own':''} ${pk?'picked':''}"><div class="ib-t"><span>${day!=null?fmtDate(dateOf(day)):''}</span><b>${crestSVG(CLUBS[h],16)} ${esc(CLUBS[h].name)}</b><b>${crestSVG(CLUBS[a],16)} ${esc(CLUBS[a].name)}</b>${own?'<em>Senin takımın!</em>':''}</div><div class="ib-q">${quick}</div><button class="ib-plus" data-cz="ibOpen" data-k="${k}">${I.open[k]?'−':'+'}${I.open[k]?'':IB_MK.reduce((s,m)=>s+(m[0]==='sk'?12:m[2].length),0)}</button>${more}</div>`;}
function ibSlipHTML(){const I=ibS(),o=I.slip.reduce((a,x)=>a*x.o,1),amt=I.amt||100;
  return `<aside class="ib-slip"><p class="ib-sh">Kuponum <span>${I.slip.length} maç</span></p>${I.slip.length?I.slip.map((x,i)=>`<div class="ib-si"><div><b>${esc(CLUBS[x.h].short)} – ${esc(CLUBS[x.a].short)}</b><small>${esc(IB_MKN[x.mk]||'')} · <u>${esc(x.lab)}</u></small></div><em>${x.o.toFixed(2)}</em><button data-cz="ibRm" data-i="${i}">✕</button></div>`).join(''):'<p class="muted">Oranlara dokunarak maç ekle. Her maçtan tek seçim yapılır; kuponun tutması için hepsinin bilinmesi gerekir.</p>'}
   <div class="ib-tot"><span>Toplam oran</span><b>${o.toFixed(2)}</b></div><div class="cz-seg">${[20,50,100,500,1000,5000].map(v=>`<button data-cz="ibAmt" data-v="${v}" class="${amt===v?'on':''}">${eur(v)}</button>`).join('')}</div>
   <div class="ib-amt"><label>Kupon bedeli</label><input id="ibAmtIn" type="number" inputmode="numeric" min="2" value="${amt}"><span>€</span></div>
   <div class="ib-tot win"><span>Olası kazanç</span><b id="ibWin">${eur(Math.round(amt*o))}</b></div>
   <div class="cz-row"><button class="cz-btn gold big" data-cz="ibPlay" ${I.slip.length?'':'disabled'}>KUPONU OYNA</button><button class="cz-btn" data-cz="ibClr">Temizle</button></div>
   <p class="gb-warn" style="font-size:11.5px">⚠ Futbolla ilgili meslekte maç bahsi yasaktır; kupondaki her maç yakalanma riskini artırır, kendi takımının maçı en riskli olanıdır. Kupon bedeli nakit paranızdan düşer.</p></aside>`;}
function ibCouponsHTML(){const g=czG(),H=g.cpH||[],L=g.cps||[];const row=c=>`<div class="ib-cp ${c.res==='kazandı'?'won':c.res==='kaybetti'?'lost':''}"><div class="ib-cph"><b>${c.sel.length} maç · oran ${(+c.o).toFixed(2)}</b><span>${eur(c.amt)} → ${c.res==='kazandı'?'<b class="pos">'+eur(c.pay)+'</b>':c.res==='kaybetti'?'<b class="neg">yattı</b>':c.res==='iptal'?'iade':'olası '+eur(Math.round(c.amt*c.o))}</span></div>${c.sel.map(b=>`<div class="ib-cps ${b.st||''}"><span>${b.st==='ok'?'✔':b.st==='x'?'✘':'⏳'}</span><b>${esc(CLUBS[b.h]?CLUBS[b.h].short:'')} – ${esc(CLUBS[b.a]?CLUBS[b.a].short:'')}</b><small>${esc(b.lab||(['MS 1','MS X','MS 2'][b.sel]||''))}${b.sc?' · '+b.sc:''}</small><em>${(+b.o).toFixed(2)}</em></div>`).join('')}</div>`;
  return `<div class="ib-cps-w"><p class="ib-sh">Açık kuponlar <span>${L.length}</span></p>${L.map(row).join('')||'<p class="muted">Açık kuponun yok.</p>'}<p class="ib-sh">Geçmiş <span>${H.length}</span></p>${H.slice(0,15).map(row).join('')||'<p class="muted">Henüz sonuçlanan kupon yok.</p>'}</div>`;}
czBayi=function(){const I=ibS(),g=czG();if(!ibCanBet()&&I.tab==='mb')I.tab='lt';
  const tabs=`<div class="cz-seg ib-tabs">${[['mb','⚽ Maç bahsi'],['kp',`🧾 Kuponlarım${(g.cps||[]).length?' ('+g.cps.length+')':''}`],['lt','🎱 Sayısal Loto']].map(([k,l])=>`<button data-cz="ibTab" data-v="${k}" class="${I.tab===k?'on':''}">${l}</button>`).join('')}</div>`;
  if(I.tab==='lt'){const L=g.lastDraw;return tabs+`<section class="cz-p"><h3>Sayısal Loto</h3><p class="muted">6 sayı seç · kupon ${eur(5)} · çekiliş çarşamba ve cumartesi · 6 bilen ${eur(2500000)}</p><div class="lt-g">${[...Array(49)].map((_,i)=>`<button class="lt-n ${(GB.lt||[]).includes(i+1)?'on':''}" data-cz="ltP" data-v="${i+1}">${i+1}</button>`).join('')}</div><div class="cz-row"><button class="cz-btn" data-cz="ltR">Rastgele</button><button class="cz-btn gold" data-cz="ltB" ${(GB.lt||[]).length===6?'':'disabled'}>Kuponu yatır (nakit)</button></div>${g.lotto.length?`<p class="muted">Bekleyen ${g.lotto.length} kupon</p>`:''}${L?`<p class="muted">Son çekiliş: ${L.D.join(' - ')} · ${L.tot?'ikramiye '+eur(L.tot):'ikramiye yok'}</p>`:''}</section>`;}
  if(I.tab==='kp')return tabs+`<section class="cz-p">${ibCouponsHTML()}</section>`;
  const Ls=ibLeagues(),R=ibRound(I.lid,I.off),Lg=LEAGUES[I.lid];
  const lgBar=`<div class="ib-lgs">${Ls.map(l=>`<button data-cz="ibLg" data-v="${l}" class="${I.lid===l?'on':''}">${flagImg(CC3[LEAGUES[l].cc]||'TUR','fl-row')} ${esc(LEAGUES[l].short)}</button>`).join('')}</div>`;
  const wk=`<div class="cz-seg">${[0,1,2].map(o=>{const r=ibRound(I.lid,o);return r?`<button data-cz="ibWk" data-v="${o}" class="${I.off===o?'on':''}">${o===0?'Bu hafta':o===1?'Gelecek hafta':'2 hafta sonra'} · ${r.w+1}. hafta</button>`:'';}).join('')}</div>`;
  const list=R?R.fx.map(([h,a])=>ibMatchRow(I.lid,R.w,h,a,R.day)).join(''):'<p class="muted">Bu ligde oynanacak maç kalmadı.</p>';
  return tabs+`<div class="ib-wrap"><section class="cz-p ib-main"><div class="ib-hd"><h3>${esc(Lg.name)}</h3>${R?`<span>${R.w+1}. hafta · ${fmtDate(dateOf(R.day))}</span>`:''}</div>${lgBar}${wk}<div class="ib-cols"><span></span><span>MS 1 · X · 2 · 2,5 Alt/Üst · KG Var/Yok</span><span>Tümü</span></div>${list}</section>${ibSlipHTML()}</div>`;};

