/* ================= v43: maç motoru — profil özellikleri maça etki eder · 2B ekran geliştirmeleri ================= */
const fxF=(p,n)=>(p&&p.fa&&p.fa[n]!=null)?p.fa[n]:10;
fxMkP=(old=>function(T,p,i,S,roles,dmin,dmax){const P=old.apply(this,arguments);try{const A=fmAttrs(p),fa={};for(const [n,v] of Object.entries(A.raw||{}))fa[n]=to20(v);
    if(A.gk)fa._gk=((fa['Refleks']||10)*1.4+(fa['Bire Bir']||10)+(fa['Hava Hakimiyeti']||10)*0.8+(fa['Elle Oyun']||10)*0.8)/4;P.fa=fa;
    const a=fxPA(p),b=T.boost;for(const k in a)P.a[k]=clamp(65+(a[k]+b-65)*0.55,10,99);P.ovr=70+(p.ovr+b-70)*0.55;}catch(e){}return P;})(fxMkP);
/* takım lideri: sahadaki en yüksek liderlik */
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{for(const T of FX.T)T.lead=Math.max(...T.P.map(p=>fxF(p,'Liderlik')));}catch(e){}return r;})(fxStart);
if(typeof fxStartHeadless==='function')fxStartHeadless=(old=>function(o){const r=old.apply(this,arguments);try{for(const T of FX.T)T.lead=Math.max(...T.P.map(p=>fxF(p,'Liderlik')));}catch(e){}return r;})(fxStartHeadless);
const fxShk=T=>{const S=FX;return T&&T.sh&&T.sh.until>S.t?T.sh.k:null;};
/* karar kalitesi: karar alma, vizyon, baskı altında soğukkanlılık, geç dakikalarda konsantrasyon, liderlik */
function fxDecM(c,pr){const S=FX,T=c.T;let m=1-(fxF(c,'Karar Alma')-12)*0.03-(fxF(c,'Vizyon')-12)*0.012;if(pr<2.5)m+=(12-fxF(c,'Soğukkanlılık'))*0.025;if(S.t>4500)m+=(12-fxF(c,'Konsantrasyon'))*0.02;if(T.lead)m-=(T.lead-12)*0.012;if(fxShk(T)==='odak')m-=0.06;return clamp(m,0.45,1.6);}
function fxShV(c,gd){return gd>20?(fxF(c,'Uzaktan Şut')-12)*0.03:gd<=16?(fxF(c,'Bitiricilik')-12)*0.015:0;}
function fxShQ(c,pr,setK){if(setK==='pen')return (fxF(c,'Penaltı Kullanma')-12)*0.022;if(setK==='fk')return (fxF(c,'Serbest Vuruş Kullanma')-12)*0.035;const S=FX,T=c.T,gd=Math.hypot(FXL-fxU(T,c.x),fxV(T,c.y)-34);let q=gd>18?(fxF(c,'Uzaktan Şut')-12)*0.018:(fxF(c,'Bitiricilik')-12)*0.016;if(pr<2)q+=(fxF(c,'Soğukkanlılık')-12)*0.015;return q;}
const fxGkQ=gk=>gk&&gk.fa&&gk.fa._gk?(gk.fa._gk-12)*0.008:0;
function fxPaM(c,L){return (fxF(c,'Pas')-12)*0.004+(L>25?(fxF(c,'Vizyon')-12)*0.004:0)+(fxF(c,'Teknik')-12)*0.0015;}
function fxPaV(c,L,gain,p){const k=fxShk(c.T);let v=(fxF(c,'Takım Oyunu')-12)*0.008;if(k==='sakla'&&gain<=2&&p>0.88)v+=0.1;if(k==='direkt'&&(L>25||gain>8))v+=0.12;return v;}
function fxIcp(c,r){const O=fxOpp(c.T);let best=null,bd=9;const L=Math.hypot(r.x-c.x,r.y-c.y)||1;for(const q of fxOn(O)){if(q.spos==='KL')continue;const t=clamp(((q.x-c.x)*(r.x-c.x)+(q.y-c.y)*(r.y-c.y))/(L*L),0.15,0.9),px=c.x+(r.x-c.x)*t,py=c.y+(r.y-c.y)*t,dd=Math.hypot(q.x-px,q.y-py);if(dd<bd){bd=dd;best={q,x:px,y:py};}}
  if(!best||bd>1.4)return null;const ch=0.04+(fxF(best.q,'Önsezi')+fxF(best.q,'Pozisyon Alma')-20)*0.006-(fxF(c,'Pas')-12)*0.004;return Math.random()<clamp(ch,0.01,0.2)?best:null;}
const fxTkW=(d,c)=>(fxF(d,'Top Kapma')-fxF(c,'Dripling'))*0.008+(fxF(d,'Güç')-fxF(c,'Denge'))*0.005+(fxF(d,'Markaj')-12)*0.004-(fxF(c,'Çeviklik')-12)*0.004;
const fxFoulM=d=>(0.7+fxF(d,'Agresiflik')/33)*(1.3-fxF(d,'Top Kapma')/40);
const fxTkF=d=>0.8+fxF(d,'Çalışkanlık')/50;
const fxSpd=p=>(fxF(p,'Hız')+fxF(p,'Hızlanma')-24)*0.025;
function fxStM(p){const S=FX,T=p.T,behind=S.score[T.side]<S.score[1-T.side];return (1.25-p.a.ph/500-fxF(p,'Dayanıklılık')/50)*(behind?1-(fxF(p,'Kararlılık')-12)*0.015:1);}
const fxCrQ=c=>(fxF(c,'Orta Yapma')-12)*0.022;
const fxAirA=q=>(fxF(q,'Kafa Vuruşu')+fxF(q,'Zıplama'))*2.0;
const fxAirD=q=>(fxF(q,'Kafa Vuruşu')*0.6+fxF(q,'Zıplama')+fxF(q,'Markaj')*0.6)*1.8;
function fxTaker(T,kind){const S=FX,on=fxOn(T).filter(q=>q.spos!=='KL');if(!on.length)return null;if(T===S.U&&G.m&&G.m.sett&&G.m.sett[kind]){const p=on.find(q=>q.k===G.m.sett[kind]);if(p)return p;}
  const at=kind==='pen'?'Penaltı Kullanma':kind==='fk'?'Serbest Vuruş Kullanma':'Korner';return on.slice().sort((a,b)=>fxF(b,at)-fxF(a,at)||b.a.sh-a.a.sh)[0];}
/* büyük fırsat sayacı */
fxShoot=(old=>function(c,pr,setK){try{const T=c.T,st=FX.stats[T.side];const xg=setK==='pen'?0.76:setK?0:fxXG(T,c.x,c.y);if(xg>=0.3)st.bc=(st.bc||0)+1;}catch(e){}return old.apply(this,arguments);})(fxShoot);
/* yeni seslenmeler */
Object.assign(FX_SHOUT,{sakla:['Topu sakla','Kısa ve güvenli pas, oyun yavaşlar.'],direkt:['Direkt oyna','Uzun top ve ara pası artar.']});
/* ---------- 2B ekran: istatistik, diziliş, kaplamalar ---------- */
const fxSum=(T,k)=>T.P.reduce((a,p)=>a+(p.s[k]||0),0);
fxBodyUI=(old=>function(){old();const S=FX,el=$('#fxBody');if(!S||!el||S.phase==='ht'||S.phase==='end')return;try{
  if(S.tab==='st'){const a=S.stats[0],b=S.stats[1],U=S.T[0],O=S.T[1],row=(l,x,y)=>{const s=(x+y)||1;return `<div class="fx-str"><b>${x}</b><span>${l}</span><b>${y}</b><i><em style="width:${x/s*100}%"></em></i></div>`;};
    const extra=`<p class="fx-sub">Ek istatistikler</p>${row('Büyük fırsat',a.bc||0,b.bc||0)}${row('Pas',a.pa,b.pa)}${row('Top kapma',fxSum(U,'tk'),fxSum(O,'tk'))}${row('Kurtarış',fxSum(U,'sv'),fxSum(O,'sv'))}`;
    const pl=T=>T.P.filter(p=>!p.subbed||p.s.pa>0).sort((x,y)=>fxR(y)-fxR(x)).map(p=>`<tr class="${p.off?'off':''}"><td class="l">${esc(p.sur)}${p.yel?' 🟨':''}${p.off?' 🟥':''}</td><td>${p.spos}</td><td>${p.s.pa}</td><td>${p.s.sh}</td><td>${p.s.tk}</td><td>${p.s.g}/${p.s.as}</td><td><i class="fx-stb sm"><em style="width:${p.st}%" class="${p.st<55?'lo':''}"></em></i></td><td class="rt">${dec(fxR(p),1)}</td></tr>`).join('');
    const tab=S.stT||0,TT=S.T[tab];el.insertAdjacentHTML('afterbegin','');el.insertAdjacentHTML('beforeend',`${extra}<p class="fx-sub">Oyuncu istatistikleri</p><div class="seg2"><button class="chip" data-fx="stT" data-k="0" aria-pressed="${tab===0}">${esc(S.T[0].short)}</button><button class="chip" data-fx="stT" data-k="1" aria-pressed="${tab===1}">${esc(S.T[1].short)}</button></div><table class="fx-pst"><thead><tr><th class="l">Oyuncu</th><th>Mvk</th><th>Pas</th><th>Şut</th><th>TK</th><th>G/A</th><th>Kond.</th><th>Rt</th></tr></thead><tbody>${pl(TT)}</tbody></table>`);}
  if(S.tab==='dz'){const U=S.U,cur=U.form;const on=fxOn(U).sort((a,b)=>a.slot-b.slot);
    const pitch=`<div class="dz-pitch">${on.map(p=>{const s=FMF[cur]&&FMF[cur][p.slot];const x=s?s[1]*100:50,y=s?clamp((1-s[2])*100,7,93):90;return `<button class="dz-p ${S.dzSel===p.k?'on':''}" data-fx="dzSel" data-k="${p.k}" style="left:${x}%;top:${y}%"><b>${p.num}</b><span>${esc(p.sur)}</span><em>${(FMR[p.kind]||[]).find(r=>r[0]===p.role)?(FMR[p.kind].find(r=>r[0]===p.role)[2]):''} ${dec(fxR(p),1)}</em><i style="width:${p.st}%"></i></button>`;}).join('')}</div>`;
    const sel=S.dzSel&&on.find(p=>p.k===S.dzSel);const roles=sel&&FMR[sel.kind]?`<p class="fx-sub">${esc(sel.name)} · rol ve görev</p><div class="seg2">${FMR[sel.kind].map(r=>`<button class="chip" data-fx="dzRole" data-k="${r[0]}" aria-pressed="${sel.role===r[0]}">${r[1]}</button>`).join('')}</div><div class="seg2">${Object.entries(DUTY).map(([k,v])=>`<button class="chip" data-fx="dzDuty" data-k="${k}" aria-pressed="${(sel.duty||'des')===k}">${v[0]}</button>`).join('')}</div>`:'<p class="muted" style="margin:6px 0">Rolünü değiştirmek için bir oyuncuya dokun.</p>';
    el.innerHTML=`<p class="fx-sub">Diziliş · ${cur}</p><div class="seg2 wrap">${Object.keys(FMF).map(f=>`<button class="chip" data-fx="dzForm" data-k="${f}" aria-pressed="${f===cur}">${f}</button>`).join('')}</div>${pitch}${roles}`;}
  }catch(e){console.warn(e);}})(fxBodyUI);
function fxFormation(f){const S=FX,U=S.U,SL=FMF[f];if(!SL)return;const on=fxOn(U),gk=on.find(p=>p.spos==='KL');const ds=SL.map(s=>s[2]),dmin=Math.min(...ds.filter((d,i)=>SL[i][0]!=='KL')),dmax=Math.max(...ds);
  const free=SL.map((s,i)=>i).filter(i=>SL[i][0]!=='KL'),pl=on.filter(p=>p!==gk);const assign=new Map();
  const cost=(p,i)=>{const sp=pByKey(p.k)||{pos:p.pos,k:p.k};try{return dpPen(sp,SL[i]);}catch(e){return p.spos===SL[i][0]?0:6;}};
  const pairs=[];for(const p of pl)for(const i of free)pairs.push([cost(p,i)+Math.abs(p.l-SL[i][1])*2,p,i]);pairs.sort((a,b)=>a[0]-b[0]);const usedS=new Set();
  for(const [,p,i] of pairs){if(assign.has(p)||usedS.has(i))continue;assign.set(p,i);usedS.add(i);}
  for(const [p,i] of assign){const s=SL[i],kind=slotKind(s);p.slot=i;p.spos=s[0];p.kind=kind;p.l=s[1];p.d=(s[2]-dmin)/Math.max(0.01,dmax-dmin);if(!(FMR[kind]||[]).some(r=>r[0]===p.role)){p.role=FMR[kind][0][0];p.duty='des';}}
  if(gk)gk.slot=SL.findIndex(s=>s[0]==='KL');U.form=f;fxEv(fxMin(),`${U.short} dizilişini ${f} olarak değiştirdi.`,'');for(const p of on)fxTarget&&fxTarget(p,true);}
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return old.apply(this,arguments);
  if(a==='stT'){S.stT=+k;fxUI();return;}if(a==='dzSel'){S.dzSel=S.dzSel===k?null:k;fxUI();return;}
  if(a==='dzForm'){fxFormation(k);fxUI();return;}
  if(a==='dzRole'||a==='dzDuty'){const p=fxOn(S.U).find(x=>x.k===S.dzSel);if(p){if(a==='dzRole')p.role=k;else p.duty=k;fxEv(fxMin(),`${p.sur}: ${a==='dzRole'?'rol':'görev'} değişti.`,'');}fxUI();return;}
  if(a==='ov'){S.ov=S.ov||{};S.ov[k]=!S.ov[k];const b=document.querySelector(`#fx [data-fx=ov][data-k=${k}]`);if(b)b.classList.toggle('on',!!S.ov[k]);return;}
  if(a==='ftt'){fxFtTalk(k);return;}
  if(a==='shout'){const r=old.apply(this,arguments);S.shoutFx={t:S.pt,k};return r;}
  return old.apply(this,arguments);})(fxAct);
/* sekme ve kaplama düğmeleri */
fxOpen=(old=>function(){const r=old.apply(this,arguments);try{const tabs=document.querySelector('#fx .fx-tabs');if(tabs&&!tabs.querySelector('[data-k=dz]')){const b=tabs.querySelector('[data-k=tk]');const nb=`<button data-fx="tab" data-k="dz">Diziliş</button>`;if(b)b.insertAdjacentHTML('afterend',nb);else tabs.insertAdjacentHTML('beforeend',nb);}
    const ctl=document.querySelector('#fx .fx-ctl');if(ctl&&!ctl.querySelector('[data-fx=ov]'))ctl.insertAdjacentHTML('beforeend',`<button data-fx="ov" data-k="rt" title="Oyuncu reytingleri">★ Reyting</button><button data-fx="ov" data-k="cond" title="Kondisyon halkaları">♥ Kondisyon</button>`);}catch(e){}return r;})(fxOpen);
/* kaplamalar: reyting, kondisyon, seslenme tepkileri */
fxDraw=(old=>function(){old();const S=FX,cv=$('#fxCv');if(!S||!cv)return;const ov=S.ov||{},sf=S.shoutFx&&S.pt-S.shoutFx.t<3.5?S.shoutFx:null;if(!ov.rt&&!ov.cond&&!sf)return;
  try{const c=cv.getContext('2d'),dpr=S.dpr,W=S.cw,H=S.ch,a=S.phase==='play'&&!S.ff?fxAlpha:1,L=(p,q)=>p+(q-p)*a,m=10,pw=W-m*2,ph=H-m*2,K=pw/FXL,X=x=>m+x*K,Y=y=>m+y/FXW*ph,cam=S.cam||{z:1,x:52.5,y:34},z=cam.z>1.001?cam.z:1;
    c.setTransform(dpr,0,0,dpr,0,0);if(z>1){let tx=W/2-X(cam.x)*z,ty=H/2-Y(cam.y)*z;tx=Math.min(0,Math.max(W-W*z,tx));ty=Math.min(0,Math.max(H-H*z,ty));c.setTransform(dpr*z,0,0,dpr*z,dpr*tx,dpr*ty);}
    const u=1/z,R=Math.max(7,Math.min(15,1.55*K))*u;
    for(const T of S.T)for(const p of fxOn(T)){const PX=X(L(p.px??p.x,p.x)),PY=Y(L(p.py??p.y,p.y));
      if(ov.cond&&T===S.U){c.strokeStyle=p.st>70?'#35d49a':p.st>55?'#ffd166':'#ff6b6b';c.lineWidth=2.4*u;c.beginPath();c.arc(PX,PY,R+3*u,-Math.PI/2,-Math.PI/2+Math.PI*2*p.st/100);c.stroke();}
      if(ov.rt){const r=fxR(p);c.font=`700 ${10*u}px Barlow Semi Condensed,sans-serif`;c.textAlign='left';c.textBaseline='middle';const t=dec(r,1),tw=c.measureText(t).width+6*u;c.fillStyle=r>=7.5?'#1f9d55':r>=6.8?'#3157d6':r>=6.2?'#6b5fa8':'#c23b4a';c.fillRect(PX+R+1*u,PY-R-6*u,tw,12*u);c.fillStyle='#fff';c.fillText(t,PX+R+4*u,PY-R);}
      if(sf&&T===S.U){const e=sf.ok===false?'😒':({ovgu:'😊',cesaret:'💪',iste:'😤',odak:'🧐',sakin:'😌',atesle:'🔥',sakla:'🙂',direkt:'⚡'}[sf.k]||'👍');c.font=`${13*u}px sans-serif`;c.textAlign='center';c.fillText(e,PX,PY-R-9*u);}}
    c.setTransform(1,0,0,1,0,0);}catch(e){}})(fxDraw);
/* maç sonu konuşması */
fxEndHTML=(old=>function(){const h=old.apply(this,arguments),S=FX;if(S.watch||G.mode!=='mgr')return h;const d=S.score[0]-S.score[1];
  return h.replace('<button class="cta" data-fx="done">',`<p class="fx-sub">Maç sonu konuşması</p><div class="fx-ftt">${[['ovgu','Övgü: “Gurur duydum”'],['sakin','Sakin: “Önümüze bakacağız”'],['hayal','Hayal kırıklığı: “Bu yetmez”']].map(([k,l])=>`<button class="btn sm${S.ftt===k?' on':''}" data-fx="ftt" data-k="${k}" ${S.ftt?'disabled':''}>${l}</button>`).join('')}</div><button class="cta" data-fx="done">`);})(fxEndHTML);
function fxFtTalk(k){const S=FX;if(S.ftt)return;S.ftt=k;const d=S.score[0]-S.score[1];const eff=k==='ovgu'?(d>=0?3:-2):k==='hayal'?(d<0?2:-3):1;try{for(const p of S.U.P){const sp=pByKey(p.k);if(sp)relAdd(sp,eff+(fxR(p)>=7.2&&k==='ovgu'?1:0));}}catch(e){}
  toast(eff>0?'Oyuncular konuşmanı olumlu karşıladı':'Oyuncular konuşmandan hoşlanmadı');const el=$('#fxBody');if(el)el.innerHTML=fxEndHTML();}

