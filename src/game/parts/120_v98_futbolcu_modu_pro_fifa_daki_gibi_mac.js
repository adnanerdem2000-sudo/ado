/* ================= v98: futbolcu modu "Pro" — FIFA'daki gibi maç boyunca tek oyuncunu yönet (3B/2B) =================
   Maç gerçek motorda akar, goller ve kartlar motordan gelir; sen yalnızca kendi oyuncunu yönetirsin, diğerleri yapay zekâ.
   Eski modlar ayarlardan seçilebilir: "Anlar" (3B akış + kritik anlarda mini oyun) ve "Klasik" (2B anlatım + anlar). */
function plMode(){try{const v=localStorage.getItem('plmode');if(v==='pro'||v==='moment'||v==='classic')return v;if(localStorage.getItem('pl3d')==='0')return 'classic';}catch(e){}return 'pro';}
pl3Pref=function(){if(plMode()==='classic')return false;return f3Sup();};
const PRO={on:0,ei:-1,keys:{},jx:0,jy:0,kx:0,ky:0,spr:0,kspr:0,bound:null,pt:0,hint:1};
function proUsable(){try{return plMode()==='pro'&&localStorage.getItem('abeng')!=='0'&&typeof ABM!=='undefined';}catch(e){return false;}}
/* ---------- maç başlangıcı: MR yalnızca kayıt tutar (kondisyon, sakatlık, giriş/çıkış); goller ve anlar motordan ---------- */
pl3Start=(old=>function(cfg){const pro=proUsable();PL3.pro=pro?1:0;const r=old.apply(this,arguments);
  if(pro&&MR){MR.pro=1;MR.events=(MR.events||[]).filter(e=>!['us','opp','ch'].includes(e.k));MR.ei=0;PRO.on=1;PRO.ei=-1;PRO.pt=0;Object.assign(PRO,{keys:{},jx:0,jy:0,kx:0,ky:0,spr:0,kspr:0});
    try{fxEv(0,'Pro modu: oyuncunu sen yönetiyorsun. Klavye: yön tuşları/WASD hareket, Shift depar, Boşluk pas, K şut, L ara pası, I orta, E pas iste / baskı.','bold');}catch(e){}}
  else PRO.on=0;return r;})(pl3Start);
pl3Abort=(old=>function(){PRO.on=0;proClean();return old.apply(this,arguments);})(pl3Abort);
pl3Close=(old=>function(mid){const r=old.apply(this,arguments);try{if(!PL3.on){PRO.on=0;proClean();}}catch(e){}return r;})(pl3Close);
function proClean(){try{const W=ABM.win;if(W){W.__abRing=null;const o=W.document.getElementById('abh-pro');if(o)o.remove();try{const R=W.ado2d.view.renderer();if(R)R.proFocus=null;}catch(e){}}}catch(e){}PRO.ei=-1;}
/* ---------- motor olayları → MR ---------- */
abEv=(old=>function(e){const r=old.apply(this,arguments);try{const S=ABM.fx;if(!(PRO.on&&S&&S.pl3&&MR&&MR.pro))return r;const side=abE2S(e.team),me=pl3Me(),mei=me&&me.ei!=null?me.ei:-2,mn=Math.min(MR.min,MR.end);
    if(e.type==='GOAL'){const own=!!(e.meta&&e.meta.own);
      if(side===0){MR.gu++;PL3.gu=MR.gu;const mine=e.p===mei&&!own,as=!own&&e.meta&&e.meta.assist===mei;if(mine){MR.goals++;PL3.g=MR.goals;MR.mom=clamp((MR.mom||0)+1,-3,3);}if(as){MR.assists++;PL3.a=MR.assists;}
        try{feed(mn,mine?`GOL! ${esc(G.p.name||PN())} ağları buldu!`:as?`GOL! ${esc(G.p.name||PN())}’in pasında takım arkadaşı attı. ASİST.`:`GOL! ${esc(MR.us.name)} ${MR.gu>MR.go?(MR.gu-MR.go===1?'öne geçti':'farkı açtı'):MR.gu===MR.go?'beraberliği yakaladı':'farkı azalttı'}.`,'us'+(mine||as?' me':''));}catch(x){}
        if(mine)abToast('⚽ GOL! Harika bitiriş.');else if(as)abToast('🅰 Asist! Pasın gole dönüştü.');}
      else{MR.go++;PL3.go=MR.go;try{feed(mn,`Gol. ${esc(MR.opp.name)} ${MR.go>MR.gu?(MR.go-MR.gu===1?'öne geçti':'farkı açtı'):MR.go===MR.gu?'beraberliği yakaladı':'farkı azalttı'}.`,'opp');}catch(x){}}
      try{renderBoard();}catch(x){}pl3Hud();}
    else if(e.type==='CARD'&&e.p===mei){const red=e.meta&&e.meta.card==='R';if(red){MR.rc=1;MR.out=true;MR.outMin=mn;abToast('🟥 Kırmızı kart! Oyundan atıldın.');}else{MR.yc++;abToast('🟨 Sarı kart gördün. Dikkatli ol.');}pl3Hud();}
    else if((e.type==='TACKLE'||e.type==='INTERCEPT')&&e.p===mei){MR.tackles=(MR.tackles||0)+1;}
  }catch(x){console.warn('pro olay',x);}return r;})(abEv);
/* maç notu: motorun oyuncu reytingi */
mrFinish=(old=>function(){try{if(MR&&MR.pro){const me=FX&&FX.U&&FX.U.P.find(p=>p.k==='ME');const rt=me&&me.rt?me.rt:null;if(rt){const win=MR.gu>MR.go,draw=MR.gu===MR.go;MR.adj=rt-6.0-(win?0.35:draw?0.05:-0.25);}}}catch(e){}return old.apply(this,arguments);})(mrFinish);
/* ---------- her kare: kontrol, kamera, halka, kondisyon ---------- */
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const S=ABM.fx,sim=ABM.sim,W=ABM.win;if(!(PRO.on&&S&&S.pl3&&sim&&W))return r;
    sim.noGoal=false;sim.forceGoal=null;if(ABM.fq&&ABM.fq.length)ABM.fq.length=0;
    const me=pl3Me(),q=me&&me.ei!=null?sim.players[me.ei]:null,live=!!(q&&!q.off&&!MR.out);
    if(live){if(PRO.ei!==me.ei){sim.setCtl(me.ei);PRO.ei=me.ei;}const c=sim.ctl;if(c){c.auto=!!ABM.ff;const jx=PRO.jx||PRO.kx,jy=PRO.jy||PRO.ky,l=Math.hypot(jx,jy);sim.ctlInput(l>1?jx/l:jx,l>1?jy/l:jy,!!(PRO.spr||PRO.kspr));}
      W.__abRing=[{id:me.ei,col:'#3fe0ff'}];try{const R=W.ado2d.view.renderer();if(R)R.proFocus={x:q.x,y:q.y};}catch(e){}
      /* depar kondisyon yer */
      const dt=Math.max(0,sim.t-(PRO.pt||sim.t));PRO.pt=sim.t;if((PRO.spr||PRO.kspr)&&Math.hypot(PRO.jx||PRO.kx,PRO.jy||PRO.ky)>.2)MR.cond=Math.max(0,MR.cond-dt*sim.C.CK/60*0.18);
      if(MR.cond<35&&q.stamCap!=null)q.stam=Math.min(q.stam,.45+MR.cond/100);}
    else{if(PRO.ei>=0){try{sim.setCtl(null);}catch(e){}PRO.ei=-1;}W.__abRing=null;try{const R=W.ado2d.view.renderer();if(R)R.proFocus=null;}catch(e){}PRO.pt=sim.t;}
    proUI(live);proBind();}catch(e){console.warn('pro',e);}return r;})(abTickCore);
/* ---------- klavye ---------- */
const PRO_MV={arrowup:'u',w:'u',arrowdown:'d',s:'d',arrowleft:'l',a:'l',arrowright:'r',d:'r'};
const PRO_ACT={' ':'pass',j:'pass',k:'shoot',l:'through',i:'cross',u:'cross',e:'ctx',q:'ctx'};
function proKeyVec(){const K=PRO.keys;PRO.kx=(K.r?1:0)-(K.l?1:0);PRO.ky=(K.d?1:0)-(K.u?1:0);}
function proAct(a){const sim=ABM.sim;if(!sim||!sim.ctl)return;if(a==='ctx'){const B=sim.ball,me=sim.players[sim.ctl.id];a=B.owner===me?'pass':B.owner&&B.owner.team===me.team?'call':'tackle';}
  sim.ctlAct(a);proFlash(a);}
function proKey(e,down){if(!PRO.on||PRO.ei<0)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;const k=(e.key||'').toLowerCase();
  if(PRO_MV[k]){PRO.keys[PRO_MV[k]]=down;proKeyVec();e.preventDefault();return;}
  if(k==='shift'){PRO.kspr=down?1:0;return;}
  if(down&&!e.repeat&&PRO_ACT[k]){proAct(PRO_ACT[k]);e.preventDefault();}}
function proBind(){const W=ABM.win;const docs=[document,W&&W.document].filter(Boolean);for(const d of docs){if(d.__proB)continue;d.__proB=1;d.addEventListener('keydown',e=>proKey(e,true),true);d.addEventListener('keyup',e=>proKey(e,false),true);
    (d.defaultView||window).addEventListener('blur',()=>{PRO.keys={};PRO.kx=PRO.ky=0;PRO.kspr=0;});}}
/* ---------- dokunmatik: sol el joystick, sağ el düğmeler ---------- */
function proCSS(d){if(d.getElementById('pro-style'))return;const st=d.createElement('style');st.id='pro-style';st.textContent=`
#abh-pro{position:fixed;inset:auto 0 0 0;z-index:2147482000;pointer-events:none;display:flex;justify-content:space-between;align-items:flex-end;padding:0 12px 12px}
#abh-pro .joy{pointer-events:auto;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.18);position:relative;touch-action:none}
#abh-pro .joy i{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:rgba(255,201,60,.55);box-shadow:0 0 0 2px rgba(255,255,255,.3)}
#abh-pro .pad{pointer-events:auto;display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,64px);gap:8px;touch-action:none}
#abh-pro .pad button{border-radius:50%;border:1.5px solid rgba(255,255,255,.25);background:rgba(10,16,30,.6);color:#fff;font:800 11.5px Inter,sans-serif;letter-spacing:.03em;touch-action:none;-webkit-user-select:none;user-select:none}
#abh-pro .pad button.on{background:#ffc93c;color:#1a1300}
#abh-pro .pad .sh{background:rgba(229,72,77,.75)}#abh-pro .pad .ps{background:rgba(31,182,255,.6)}
#abh-pro .keys{pointer-events:auto;font:600 12px Inter,sans-serif;color:#d3dbe8;background:rgba(10,16,30,.78);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:7px 10px;max-width:640px}
#abh-pro .keys b{color:#ffc93c}#abh-pro .keys button{margin-left:8px;background:none;border:0;color:#8494af;cursor:pointer;font:600 12px Inter,sans-serif}
#abh-pro .act{position:fixed;left:50%;top:18%;transform:translateX(-50%);font:900 22px 'Barlow Condensed',Inter,sans-serif;letter-spacing:.08em;color:#ffc93c;text-shadow:0 2px 10px rgba(0,0,0,.7);opacity:0;transition:opacity .25s}
#abh-pro .act.on{opacity:1}
body.ab-pfs #abh-pro{padding-bottom:calc(128px + env(safe-area-inset-bottom))}@media (orientation:landscape){body.ab-pfs #abh-pro{padding-bottom:14px}}
@media (max-width:600px){#abh-pro .joy{width:124px;height:124px}#abh-pro .pad{grid-template-columns:repeat(3,54px);grid-template-rows:repeat(2,54px);gap:6px}}`;d.head.appendChild(st);}
function proTouch(){try{return matchMedia('(pointer:coarse)').matches||('ontouchstart' in window);}catch(e){return false;}}
function proUI(live){const W=ABM.win;if(!W)return;const d=W.document;let o=d.getElementById('abh-pro');
  if(!PRO.on){if(o)o.remove();return;}
  if(!o){proCSS(d);o=d.createElement('div');o.id='abh-pro';const touch=proTouch();
    o.innerHTML=touch?`<div class="joy"><i></i></div><div class="act"></div><div class="pad"><button data-a="through">ARA</button><button data-a="cross">ORTA</button><button data-a="ctx">İSTE</button><button class="ps" data-a="pass">PAS</button><button class="sh" data-a="shoot">ŞUT</button><button data-a="spr">DEPAR</button></div>`
      :`<div class="keys">${PRO.hint?`<b>WASD/oklar</b> hareket · <b>Shift</b> depar · <b>Boşluk</b> pas · <b>K</b> şut · <b>L</b> ara pası · <b>I</b> orta · <b>E</b> pas iste / baskı<button type="button" data-a="hide">gizle</button>`:''}</div><div class="act"></div><span></span>`;
    if(!touch)o.style.justifyContent='center';d.body.appendChild(o);proTouchBind(o);try{$('#fx').classList.toggle('pro-t',touch);}catch(e){}if(touch)setTimeout(()=>{try{const st=W.ado2d.state,b=d.getElementById('ab-fs-btn');if(st&&!st.pfs&&b&&!d.fullscreenElement)b.click();}catch(e){}},400);}
  o.style.display=live&&!(ABM.win.ado2d.state.hold==='replay')?'':'none';}
function proFlash(a){try{const o=ABM.win.document.querySelector('#abh-pro .act');if(!o)return;o.textContent={pass:'PAS',shoot:'ŞUT',through:'ARA PASI',cross:'ORTA',call:'PAS İSTE!',tackle:'BASKI'}[a]||'';o.classList.add('on');clearTimeout(PRO.ft);PRO.ft=setTimeout(()=>o.classList.remove('on'),550);}catch(e){}}
function proTouchBind(o){const joy=o.querySelector('.joy'),knob=joy&&joy.querySelector('i');
  if(joy){let id=null,cx=0,cy=0;const R=joy.clientWidth/2||70;
    const mv=e=>{const dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy),m=Math.min(1,l/(R*.8));const ux=l?dx/l:0,uy=l?dy/l:0;PRO.jx=ux*m;PRO.jy=uy*m;if(knob)knob.style.transform=`translate(${ux*m*R*.6}px,${uy*m*R*.6}px)`;};
    joy.addEventListener('pointerdown',e=>{id=e.pointerId;const b=joy.getBoundingClientRect();cx=b.left+b.width/2;cy=b.top+b.height/2;try{joy.setPointerCapture(id);}catch(x){}mv(e);e.preventDefault();});
    joy.addEventListener('pointermove',e=>{if(e.pointerId===id)mv(e);});
    const up=e=>{if(e.pointerId!==id)return;id=null;PRO.jx=PRO.jy=0;if(knob)knob.style.transform='';};joy.addEventListener('pointerup',up);joy.addEventListener('pointercancel',up);}
  o.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;e.preventDefault();
    if(a==='hide'){PRO.hint=0;o.remove();return;}if(a==='spr'){PRO.spr=1;b.classList.add('on');const end=()=>{PRO.spr=0;b.classList.remove('on');b.removeEventListener('pointerup',end);b.removeEventListener('pointercancel',end);b.removeEventListener('pointerleave',end);};b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('pointerleave',end);return;}
    b.classList.add('on');setTimeout(()=>b.classList.remove('on'),160);proAct(a);});}
/* ---------- ayarlar: futbolcu maç modu ---------- */
ACTX.plMode=el=>{const m=el.dataset.m;try{localStorage.setItem('plmode',m);if(m!=='classic')localStorage.setItem('pl3d','1');}catch(e){}toast(m==='pro'?'Pro modu: maç boyunca kendi oyuncunu yöneteceksin':m==='moment'?'Anlar modu: maç 3B akar, kritik anlarda kontrol sende':'Klasik mod: anlatım ve kritik anlar');
  try{document.querySelectorAll('[data-act=plMode]').forEach(b=>b.classList.toggle('on',b.dataset.m===m));}catch(e){}};
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc)return r;const old3=mc.querySelector('.pl3-set');if(old3)old3.remove();if(mc.querySelector('.plm-set'))return r;const m=plMode();
  const h=`<div class="plm-set"><p class="sub-h" style="margin:14px 0 6px"><span>Futbolcu kariyerinde maç</span></p><div class="seg plm-seg">${[['pro','Pro (oyuncunu yönet)'],['moment','Anlar (eski 3B)'],['classic','Klasik']].map(([k,l])=>`<button class="chip${m===k?' on':''}" data-act="plMode" data-m="${k}">${l}</button>`).join('')}</div><p class="muted" style="font-size:12.5px;margin:6px 0 0">Pro: FIFA'daki gibi maç boyunca yalnız kendi oyuncunu yönetirsin. Anlar: maç 3B akar, pozisyon sana gelince mini oyun açılır. Klasik: anlatım ekranı ve anlar.</p></div>`;
  (mc.lastElementChild||mc).insertAdjacentHTML('beforebegin',h);}catch(e){}return r;})(openSettings);

