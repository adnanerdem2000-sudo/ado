/* ================= v22: hızlı maç izleme, momentum, bilgisayar taktik ekranı ================= */
const FXU=3,FX_SP=[1,2,4,8];
function fxSmart(){const S=FX,B=S.ball,x=B.x;if(S.setT>0)return 0.9;if(x>71||x<34)return 0.8;return 1.7;}
function fxMom(dt){const S=FX,x=S.ball.x;if(!S.mom)S.mom=Array.from({length:18},()=>[0,0]);const i=Math.min(17,Math.floor(Math.min(S.t,89.9*60)/300));if(x>70)S.mom[i][0]+=dt;else if(x<35)S.mom[i][1]+=dt;}
function fxOpen(){let el=$('#fx');if(!el){el=document.createElement('div');el.id='fx';el.className='fx';document.body.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-fx]');if(!b)return;fxAct(b.dataset.fx,b.dataset.k,b.dataset.v);});}
  el.hidden=false;$('#tabs').hidden=true;document.documentElement.classList.add('playing');
  if(!FX_SP.includes(FX.spd))FX.spd=2;if(FX.smart===undefined){let v=true;try{v=localStorage.getItem('fxSmart')!=='0';}catch(_){}FX.smart=v;}
  el.innerHTML=`<div class="fx-top" id="fxTop"></div><div class="fx-pw"><canvas id="fxCv"></canvas><div id="fxPop"></div></div><div class="fx-ban" id="fxBan"></div>
   <div class="fx-ctl"><button data-fx="play" id="fxPlay" data-key="Boşluk">▶</button>${FX_SP.map((s,i)=>`<button data-fx="spd" data-k="${s}" data-key="${i+1}" class="${FX.spd===s?'on':''}">${s}×</button>`).join('')}<button data-fx="ff" id="fxFF" data-key="F" title="Devre sonuna atla">⏭</button><button data-fx="smart" id="fxSm" class="${FX.smart?'on':''}" title="Orta sahada hızlan, tehlikeli anlarda yavaşla">Akıllı</button><button data-fx="names" id="fxNm" data-key="N">İsim</button><span class="fx-info" id="fxInfo"></span></div>
   <div class="fx-tabs">${[['ev','Olaylar'],['st','İstatistik'],['tk','Taktik'],['ky','Kadro'],['as','Asistan']].map(([k,l])=>`<button data-fx="tab" data-k="${k}" class="${FX.tab===k?'on':''}">${l}</button>`).join('')}</div><div class="fx-body" id="fxBody"></div>`;
  FX.names=true;FX.phase='pre';fxUI();fxResize();FX.raf=requestAnimationFrame(fxLoop);
  setTimeout(()=>{if(FX)fxResize();},60);setTimeout(()=>{if(FX&&FX.phase==='pre'){FX.phase='play';fxUI();}},900);}
function fxLoop(ts){if(!FX||!$('#fx')||$('#fx').hidden)return;const dt=Math.min(0.1,(ts-(fxLast||ts))/1000);fxLast=ts;const S=FX;
  if(S.phase==='play'){if(S.ff){let n=0;while(n<2500&&S.phase==='play'){fxStep(0.1);fxMom(0.1);n++;}S.trail=[];}
    else{fxAcc+=dt*S.spd*FXU*(S.smart?fxSmart():1);let n=0;while(fxAcc>=0.1&&n<300&&S.phase==='play'){fxStep(0.1);fxMom(0.1);fxAcc-=0.1;n++;}}
    if(S.phase!=='play'){fxAcc=0;S.ff=false;fxUI();}}
  for(const tr of S.trail)tr.t-=dt*2.2;S.trail=S.trail.filter(t=>t.t>0);if(S.flash){S.flash.t-=dt;if(S.flash.t<=0)S.flash=null;}if(S.pop){S.pop.t-=dt;if(S.pop.t<=0){S.pop=null;fxPopUI();}}
  fxDraw();S.uiT=(S.uiT||0)-dt;if(S.uiT<=0){S.uiT=S.ff?0.15:0.4;fxTopUI();if(S.tab==='ev'||S.tab==='st'||S.tab==='ky')fxBodyUI();}
  S.raf=requestAnimationFrame(fxLoop);}
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return;
  if(a==='ff'){if(S.phase==='end'||S.phase==='ht')return;S.ff=true;S.phase='play';fxUI();return;}
  if(a==='smart'){S.smart=!S.smart;try{localStorage.setItem('fxSmart',S.smart?'1':'0');}catch(_){}const b=$('#fxSm');if(b)b.classList.toggle('on',S.smart);toast(S.smart?'Akıllı hız açık: orta saha hızlı, tehlikeli anlar yavaş':'Akıllı hız kapalı');return;}
  if(a==='play'&&S.ff){S.ff=false;S.phase='pause';fxUI();return;}
  if(a==='spd')S.ff=false;
  return old(a,k,v);})(fxAct);
fxTopUI=(old=>function(){old();const S=FX,el=$('#fxTop');if(!el||!S)return;
  const mom=S.mom||[],mx=Math.max(150,...mom.map(m=>Math.abs(m[0]-m[1]))),cur=Math.min(100,S.t/5400*100);
  const bars=mom.map((m,i)=>{const d=m[0]-m[1];return `<i class="${d>=0?'u':'o'}" style="left:${i/18*100}%;height:${Math.max(4,Math.abs(d)/mx*48)}%"></i>`;}).join('');
  const marks=S.ev.filter(e=>/^GOL!/.test(e.t)||/kırmızı/i.test(e.t)).map(e=>`<b class="${e.c}" style="left:${Math.min(98,e.m/90*100)}%">${/^GOL!/.test(e.t)?'⚽':'🟥'}</b>`).join('');
  el.insertAdjacentHTML('beforeend',`<div class="fx-tl" title="Momentum: yeşil bizim baskımız, kırmızı rakibin"><div class="fx-mom">${bars}</div><em style="width:${cur}%"></em><span class="ht"></span>${marks}</div>`);
  const ff=$('#fxFF');if(ff)ff.classList.toggle('on',!!S.ff);})(fxTopUI);
fxDraw=(old=>function(){old();const S=FX,cv=$('#fxCv');if(!cv||!S)return;const c=cv.getContext('2d'),W=S.cw,H=S.ch,P=(x,y)=>fxPx(x,y),sc=(W-20)/FXW;
  c.fillStyle='rgba(255,255,255,.8)';for(const x of [11,FXL-11]){const [a,b]=P(x,34);c.beginPath();c.arc(a,b,1.6,0,7);c.fill();}
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=1.2;for(const [x,s] of [[11,1],[FXL-11,-1]]){const [a,b]=P(x,34);const r=9.15*sc,ang=Math.acos(5.5/9.15);c.beginPath();const m0=s>0?-Math.PI/2:Math.PI/2;c.arc(a,b,r,m0-ang,m0+ang);c.stroke();}
  const B=S.ball,o=B.own||(B.fl&&B.fl.to);if(o&&S.phase==='play'&&!S.ff){const T=o.T,txt=`${o.num} ${o.sur}`;c.font='800 13px Barlow Semi Condensed,sans-serif';const w=c.measureText(txt).width+18;
    c.fillStyle='rgba(0,0,0,.6)';c.fillRect(12,12,w,22);c.fillStyle=T===S.U?S.U.c1:'#ff6a5f';c.fillRect(12,12,5,22);c.fillStyle='#fff';c.textAlign='left';c.fillText(txt,22,23.5);c.textAlign='center';}
  if(S.ff&&S.phase==='play'){c.fillStyle='rgba(0,0,0,.5)';c.fillRect(0,0,W,H);c.font='800 22px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.textAlign='center';c.fillText(`⏭ ${fxMin()}’`,W/2,H/2-8);c.font='600 13px Barlow Semi Condensed,sans-serif';c.fillText('Devre sonuna ilerleniyor',W/2,H/2+16);}})(fxDraw);

/* ---------- bilgisayar: taktik ekranı tek bakışta ---------- */
tacView=(old=>function(){const h=old(),i=h.indexOf('<div class="stabs">');if(i<0)return h;setTimeout(tacFit,0);
  return `<div class="tacv"><div class="tacv-l">${h.slice(0,i).replace('Aşağıdan oyuncu ve rol seç',window.innerWidth>=1000?'Sağdan oyuncu ve rol seç':'Aşağıdan oyuncu ve rol seç')}</div><div class="tacv-r">${h.slice(i)}</div></div>`;})(tacView);
function tacFit(){const el=document.querySelector('.tacv');if(!el)return;if(window.innerWidth<1000){el.style.removeProperty('--tvh');return;}
  const top=el.getBoundingClientRect().top+window.scrollY;el.style.setProperty('--tvh',Math.max(480,window.innerHeight-top-32)+'px');
  const L=el.querySelector('.tacv-l>.panel'),pt=L&&L.querySelector('.fm-pitch');if(!pt)return;const cs=getComputedStyle(L);let used=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+16;
  for(const ch of L.children)if(ch!==pt){const s2=getComputedStyle(ch);used+=ch.offsetHeight+parseFloat(s2.marginTop)+parseFloat(s2.marginBottom);}
  const h=Math.max(260,Math.min(L.clientHeight-used,(L.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))*80/68));pt.style.height=h+'px';pt.style.width=(h*68/80)+'px';pt.style.maxWidth='none';}
window.addEventListener('resize',()=>{if(document.querySelector('.tacv'))tacFit();});

