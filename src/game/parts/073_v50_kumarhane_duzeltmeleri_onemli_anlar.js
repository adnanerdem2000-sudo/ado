/* ================= v50: kumarhane düzeltmeleri + önemli anlar modu ================= */
/* --- kumarhane: serbest bahis, otomatik fiş, görünür uyarı --- */
CZF.forEach(F=>{F.max=1e12;});CZF[0].s='Klasikler';CZF[1].s='Hızlı oyunlar';CZF[2].s='Yüksek limit';
function czMsg(t){CZ.err=t;CZ.errT=Date.now();const el=document.getElementById('czErr');if(el){el.textContent=t;el.hidden=false;clearTimeout(czMsg.t);czMsg.t=setTimeout(()=>{el.hidden=true;},3200);}else toast(t);}
czBet=function(amt){const g=czG(),F=czFl();amt=Math.round(amt);if(!(amt>0))return czMsg('Geçerli bir bahis gir'),false;if(amt<F.min)return czMsg(`${F.n}: en az ${eur(F.min)} bahis`),false;
  if(g.ch<amt){const need=Math.ceil(amt-g.ch),cash=Math.floor(U2E(G.p.money));if(cash>=need){G.p.money-=E2U(need);g.ch+=need;czMsg(`${eur(need)} nakit otomatik olarak fişe çevrildi`);}else{czMsg(`Paran yetmiyor: bahis ${eur(amt)}, fiş ${eur(Math.round(g.ch))}, nakit ${eur(cash)}. Tefeci’den borç alabilirsin.`);return false;}}
  g.ch-=amt;g.wag+=amt;g.vip+=Math.round(amt/10);gbHeat(clamp(1+amt/3000,1,6));return true;};
czBetBar=function(extra){const F=czFl(),vals=CZ_CHIPS.filter(v=>v>=F.min);if(!(CZ.bet>=F.min))CZ.bet=F.min;
  return `<div class="cz-bb"><div class="cz-chips">${vals.map(v=>`<button data-cz="chip" data-v="${v}" class="${CZ.bet===v?'on':''}" title="${eur(v)}">${chipSVG(v)}</button>`).join('')}</div>
  <div class="cz-bv"><button data-cz="bx" data-v="0.5" title="Yarıya indir">½</button><input id="czBetIn" type="number" inputmode="numeric" min="${F.min}" step="1" value="${CZ.bet}" aria-label="Bahis miktarı"><span class="cz-eur">€</span><button data-cz="bx" data-v="2" title="İkiye katla">2×</button><button data-cz="bmax" title="Tüm fişler">Max</button></div>${extra||''}</div>`;};
CZA.bx=el=>{const F=czFl();CZ.bet=Math.max(F.min,Math.round(CZ.bet*+el.dataset.v));czRender();czRedraw();};
CZA.bmax=()=>{const g=czG(),F=czFl();CZ.bet=Math.max(F.min,Math.floor(g.ch)||F.min);czRender();czRedraw();};
CZA.chip=el=>{CZ.bet=+el.dataset.v;czRender();czRedraw();};
function czRedraw(){if(CZ.view==='cr')setTimeout(crDraw,10);if(CZ.view==='pk')setTimeout(pkDraw,10);}
function czSetBet(v){const F=czFl();v=Math.round(+v);if(!(v>0))return;CZ.bet=Math.max(F.min,v);}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='czBetIn'){const v=+e.target.value;if(v>0)CZ.bet=Math.round(v);}});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='czBetIn'){czSetBet(e.target.value);e.target.value=CZ.bet;const b=document.querySelector('.cz-bv');if(b)b.classList.add('flash');setTimeout(()=>b&&b.classList.remove('flash'),300);}});
document.addEventListener('keydown',e=>{if(e.target&&e.target.id==='czBetIn'&&e.key==='Enter'){czSetBet(e.target.value);e.target.blur();}});
/* oyun başlatılırken giriş kutusundaki değeri al */
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('[data-cz]');if(!b)return;const inp=document.getElementById('czBetIn');if(inp&&document.activeElement===inp)czSetBet(inp.value);},true);
/* üst kısımda görünür mesaj alanı ve hızlı fiş */
czRender=(old=>function(){old.apply(this,arguments);try{const el=document.getElementById('cz');if(!el)return;const h=el.querySelector('.cz-h');if(h&&!el.querySelector('#czErr')){const on=CZ.err&&Date.now()-(CZ.errT||0)<3500;h.insertAdjacentHTML('afterend',`<div id="czErr" class="cz-err" ${on?'':'hidden'}>${on?esc(CZ.err):''}</div>`);if(on){clearTimeout(czMsg.t);czMsg.t=setTimeout(()=>{const e=document.getElementById('czErr');if(e)e.hidden=true;},3500-(Date.now()-CZ.errT));}}
  const g=czG(),cash=Math.floor(U2E(G.p.money));if(CZ.view==='lobby'&&g.ch<10){const b=el.querySelector('.cz-b');if(b)b.insertAdjacentHTML('afterbegin',`<section class="cz-p cz-quick"><h3>Masalara oturmak için fiş al</h3><p class="muted">Bahis yaptığında fişin yetmezse nakit paran otomatik fişe çevrilir. İstersen şimdiden fiş al:</p><div class="cz-row">${[100,1000,10000].filter(v=>v<=cash).map(v=>`<button class="cz-btn gold" data-cz="buy" data-v="${v}">${eur(v)} fiş al</button>`).join('')}${cash>0?`<button class="cz-btn" data-cz="buy" data-v="${cash}">Tüm nakit (${eur(cash)})</button>`:'<span class="muted">Nakit paran yok.</span>'}</div></section>`);}}catch(e){console.warn(e);}})(czRender);
/* --- maç: önemli anlar modu ve sonuca git --- */
function fxDanger(S){const B=S.ball;if(S.setT>0&&['co','fk','pen'].includes(S.setK))return true;if(B.fl&&(B.fl.kind==='sh'||B.fl.kind==='cr'))return true;const p=B.own||B.last;if(!p||!p.T)return false;return FXL-fxU(p.T,B.x)<21&&Math.abs(B.y-FXW/2)<24;}
const fxHlOn=()=>{try{return localStorage.getItem('fxHL')!=='0';}catch(e){return true;}};
fxLoop=(old=>function(ts){const S=FX;try{if(S&&S.hl&&S.phase==='play'&&!S.ff){const dt=Math.min(0.1,(ts-(S.hlTs||ts))/1000);S.hlTs=ts;
    if(fxDanger(S)){S.hlCalm=0;S.hlIn=true;}else{S.hlCalm=(S.hlCalm||0)+dt;if(!S.hlIn||S.hlCalm>0.6){let n=0;const g0=S.score[0]+S.score[1];while(n<1200&&S.phase==='play'&&!fxDanger(S)){fxStep(0.1);fxMom(0.1);n++;}S.trail=[];S.hlIn=false;S.hlCalm=0;if(n>5){S.hlSkip=(S.hlSkip||0)+n;}if(S.phase!=='play'){fxUI();}}}}}catch(e){console.warn(e);}
  return old.apply(this,arguments);})(fxLoop);
function fxToEnd(){const S=FX;if(!S||S.phase==='end')return;let g=0;S.ff=false;while(S.phase!=='end'&&g++<120000){if(S.phase==='ht'){S.htDone=true;fxSecond();continue;}if(S.phase!=='play')S.phase='play';fxStep(0.1);fxMom(0.1);}S.trail=[];fxUI();}
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return old.apply(this,arguments);
  if(a==='hl'){S.hl=!S.hl;try{localStorage.setItem('fxHL',S.hl?'1':'0');}catch(_){}const b=document.getElementById('fxHL');if(b)b.classList.toggle('on',S.hl);if(S.hl&&(S.phase==='pre'||S.phase==='pause'))S.phase='play';toast(S.hl?'Önemli anlar: sadece tehlikeli pozisyonlar oynatılır, gerisi anında geçilir':'Önemli anlar kapalı: maçın tamamı oynatılır');fxUI();return;}
  if(a==='toend'){fxToEnd();return;}
  return old.apply(this,arguments);})(fxAct);
fxOpen=(old=>function(){const r=old.apply(this,arguments);try{const S=FX;if(S){S.hl=fxHlOn();}const sm=document.getElementById('fxSm');if(sm&&!document.getElementById('fxHL'))sm.insertAdjacentHTML('afterend',`<button data-fx="hl" id="fxHL" class="${S&&S.hl?'on':''}" title="Sadece önemli anları izle">★ Önemli anlar</button><button data-fx="toend" id="fxEnd" title="Maçı anında sonuçlandır">⏩ Sonuç</button>`);}catch(e){console.warn(e);}return r;})(fxOpen);
fxTopUI=(old=>function(){const r=old.apply(this,arguments);try{const S=FX,i=document.getElementById('fxInfo');if(S&&i&&S.hl&&S.phase==='play')i.textContent=S.hlIn?'★ Önemli an':'⏩ Sıradaki önemli ana geçiliyor…';}catch(e){}return r;})(fxTopUI);

