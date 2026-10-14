/* ================= v142: kontroller (dokunmatik düzen, klavye tuşları) ve modern an görünümü =================
   Kontroller: Ayarlar → Kontroller. Üç durum için ayrı düğme düzeni (topa sahipken / top rakipteyken / kaleciyken),
   düğme ve joystick yeri sürüklenir, boyut (küçük/orta/büyük) ve saydamlık seçilir, joystick sol/sağ ele ve sabit/serbest olur.
   Klavyede her eylemin iki tuşu olabilir; çakışan tuş yer değiştirir. Kayıtlar: localStorage 'ctl_layout_v142', 'ctl_keys_v142'.
   Oynanış sözleşmesi (168): mgCtx() → 'atk'|'def'|'gk'|'set'|null, mgActs() → [{k,id,label,sub}] tanımlıysa kullanılır;
   ayrıca isteğe bağlı mgActsFor(g) (ayar önizlemesi), mgCardInfo(type,C) → {t,s} (başlık kartı), mgDrawExtra(c) (ek çizim),
   mgCoachChip(metin,ms) (hoca talimatı rozeti) ve MG.S.coach (metin) okunur.
   Görünüm: çim dokusu ve biçme şeritleri, tribün katları, LED pano şeridi, projektör parlaması, projektör gölgeleri,
   top gölgesi/izi/parlaması, “sen” halkası + dayanıklılık yayı + yön oku, şut nişan konisi, ağır çekim ve yakınlaşma,
   yumuşak kamera (ileri bakış), derinlik sisi, gol parlaması, yayın tarzı başlık kartı. Kaleci anlarında kamera kalemizin arkasına geçer. */

/* ---------- kamera parametreleri (kaleci anında ters açı) ---------- */
const CAMV={h:CAM_H,b:CAM_B,ct:CT,st:ST,s:1};
const GKC={h:11,b:20,look:13,f:0.85};
function camSet(h,b,s){CAMV.h=h;CAMV.b=b;const a=Math.atan2(h,b);CAMV.ct=Math.cos(a);CAMV.st=Math.sin(a);CAMV.s=s;}
toCam=function(x,y,z){const c=MG.cam,s=CAMV.s,fw=s*(c.y-y)+CAMV.b,up=z-CAMV.h;return {x:s*(x-c.x),d:fw*CAMV.ct-up*CAMV.st,u:fw*CAMV.st+up*CAMV.ct};};

/* ---------- ayar deposu ---------- */
const CTL_LS='ctl_layout_v142',CTL_KS='ctl_keys_v142',CTL_CTX=['atk','def','gk'];
const CTL_BASE={a:86,b:68,c:64,d:58,joy:112},CTL_SZ={S:0.82,M:1,L:1.2};
const CTL_GN={atk:'Topa sahipken',def:'Top rakipteyken',gk:'Kaleciyken'};
function ctlDefCtx(){return {op:0.92,joy:{x:0.2,y:0.8,s:'M'},a:{x:0.855,y:0.9,s:'M'},b:{x:0.64,y:0.93,s:'M'},c:{x:0.85,y:0.775,s:'M'},d:{x:0.64,y:0.8,s:'M'}};}
let CTLC=null;
function ctlCfg(){if(CTLC)return CTLC;let o=null;try{o=JSON.parse(localStorage.getItem(CTL_LS)||'null');}catch(e){}
  if(!o||typeof o!=='object'){o={v:1,ctx:{}};/* eski 'lay' kaydını (sağ/alt piksel) oranlara taşı */
    try{const s=setsGet();if(s.lay)for(const g of ['atk','def'])if(s.lay[g]){const c=ctlDefCtx();for(const k of ['a','b','c','d']){const L=s.lay[g][k];if(L&&L.r!=null&&L.b!=null){const sz=CTL_BASE[k];c[k].x=clamp(1-(L.r+sz/2)/412,0.05,0.95);c[k].y=clamp(1-(L.b+sz/2)/860,0.35,0.97);}}o.ctx[g]=c;}}catch(e){}}
  o.hand=o.hand==='L'?'L':'R';o.joy=o.joy==='fixed'?'fixed':'float';o.slow=o.slow!==false;o.ctx=o.ctx||{};
  for(const g of CTL_CTX){const d=ctlDefCtx(),c=o.ctx[g]||{};for(const k of ['joy','a','b','c','d']){const v=c[k]||{};if(typeof v.x==='number')d[k].x=clamp(v.x,0.03,0.97);if(typeof v.y==='number')d[k].y=clamp(v.y,0.1,0.98);if(CTL_SZ[v.s])d[k].s=v.s;}
    if(typeof c.op==='number')d.op=clamp(c.op,0.3,1);o.ctx[g]=d;}
  return CTLC=o;}
function ctlSave(){try{localStorage.setItem(CTL_LS,JSON.stringify(CTLC));}catch(e){}MG.ctlG=null;}

/* ---------- klavye eşlemesi ---------- */
const CTL_ACTS=[['up','Yukarı'],['down','Aşağı'],['left','Sol'],['right','Sağ'],['spr','Depar'],['a','A düğmesi'],['b','B düğmesi'],['c','C düğmesi'],['d','D düğmesi'],['pause','Duraklat'],['next','Sonraki an'],['fast','Hızlandır']];
const CTL_AN=Object.fromEntries(CTL_ACTS);
const CTL_KDEF={up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],spr:['Shift',null],a:['KeyK','Space'],b:['KeyJ',null],c:['KeyL',null],d:['KeyI',null],pause:['KeyP',null],next:['KeyN',null],fast:['KeyF',null]};
const CTL_MV={up:'U',down:'D',left:'L',right:'R'},CTL_BT={a:'a',b:'b',c:'c',spr:'c',d:'d'};
let CTLK=null,CTLR=null,CTLKL={};
function ctlKeys(){if(CTLK)return CTLK;let o=null;try{o=JSON.parse(localStorage.getItem(CTL_KS)||'null');}catch(e){}
  const k={};for(const [a] of CTL_ACTS){const v=o&&Array.isArray(o[a])?o[a]:CTL_KDEF[a];k[a]=[v[0]||null,v[1]||null];if(!k[a][0]&&k[a][1])k[a]=[k[a][1],null];}
  CTLKL=(o&&o._lbl&&typeof o._lbl==='object')?o._lbl:{};CTLR=null;return CTLK=k;}
function ctlKSave(){const o=Object.assign({},CTLK,{_lbl:CTLKL});try{localStorage.setItem(CTL_KS,JSON.stringify(o));}catch(e){}CTLR=null;}
function ctlRev(){if(CTLR)return CTLR;const r={},K=ctlKeys();for(const [a] of CTL_ACTS)for(const c of K[a])if(c&&!r[c])r[c]=a;return CTLR=r;}
function ctlCode(e){let c=e.code||'';if(/^Shift/.test(c))c='Shift';else if(/^Control/.test(c))c='Control';else if(/^Alt/.test(c))c='Alt';else if(/^Meta/.test(c))c='Meta';
  if(!c||c==='Unidentified'){const k=e.key||'';c=k==='Shift'?'Shift':k===' '?'Space':/^[a-z]$/i.test(k)?'Key'+k.toUpperCase():/^Arrow/.test(k)?k:'K:'+k.toLowerCase();}return c;}
function ctlKeyAct(e){return ctlRev()[ctlCode(e)]||null;}
function ctlKChanged(a){const K=ctlKeys()[a],D=CTL_KDEF[a];return !!K&&(K[0]!==D[0]||(K[1]||null)!==(D[1]||null));}
const CTL_KN={Space:'Boşluk',Shift:'Shift',Control:'Ctrl',Alt:'Alt',Meta:'Meta',Enter:'Enter',Tab:'Tab',Backspace:'Geri',CapsLock:'Caps',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
function ctlLbl(c){if(!c)return '';if(CTLKL[c])return CTLKL[c];if(CTL_KN[c])return CTL_KN[c];let m=c.match(/^Key(.)$/);if(m)return m[1];m=c.match(/^Digit(.)$/);if(m)return m[1];m=c.match(/^Numpad(.+)$/);if(m)return 'Num'+m[1];if(c.startsWith('K:'))return c.slice(2).toLocaleUpperCase('tr-TR');return c;}
function ctlBtnKey(b){const K=ctlKeys();return ctlLbl(K[b][0]||K[b][1]||(b==='c'?K.spr[0]:''));}

/* Pro maç (Adoball) klavyesi: değiştirilmiş eylemler Pro'nun kendi tuşlarına çevrilir */
const CTL_PRO={up:'w',down:'s',left:'a',right:'d',spr:'Shift',a:'k',b:'j',c:'l',d:'i'};
const CTL_PRONAT={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right',shift:'spr',' ':'b',j:'b',k:'a',l:'c',i:'d'};
try{if(typeof proKey==='function')proKey=(old=>function(e,down){try{const a=ctlKeyAct(e),nat=CTL_PRONAT[(e.key||'').toLowerCase()];
    if(a&&CTL_PRO[a]&&ctlKChanged(a))return old.call(this,{key:CTL_PRO[a],repeat:e.repeat,target:e.target,preventDefault(){e.preventDefault();}},down);
    if(a&&!CTL_PRO[a]&&nat)return;/* tuş Duraklat vb. bir eyleme atanmış: Pro'daki eski anlamını çalıştırma */
    if(!a&&nat&&ctlKChanged(nat))return;/* varsayılan tuş başka yere taşınmış */
  }catch(_){}return old.apply(this,arguments);})(proKey);}catch(e){}

/* ---------- maç içinde uygula ---------- */
function ctlSetJ(x,y){if(CAMV.s<0){x=-x;y=-y;}IN.jx=x;IN.jy=y;}
function ctlCtxNow(){let g=null;try{if(typeof mgCtx==='function')g=mgCtx();}catch(e){}
  if(!g){const k=MG.padK;g=(k==='def'||k==='dair')?'def':'atk';}if(g==='set'||!CTL_CTX.includes(g))g=g==='def'||g==='gk'?g:'atk';return g;}
/* oranlar 412×860 başvuru ekranındadır; gerçek ekranda en yakın kenara göre piksel olarak yerleşir (yatay ekranda da başparmak mesafesi korunur) */
function ctlPos(P,W,H,mir){const fx=mir?1-P.x:P.x;return [fx>0.5?W-(1-fx)*412:fx*412,P.y>0.5?H-(1-P.y)*860:P.y*860];}
function ctlApply(g){const st=$('#mvStage');if(!st)return;const C=ctlCfg(),L=C.ctx[g]||C.ctx.atk,W=st.clientWidth||412,H=st.clientHeight||860,mir=C.hand==='L';
  st.classList.add('ctl142');st.style.setProperty('--ctl-op',L.op);
  for(const k of ['a','b','c','d']){const el=document.getElementById('btn'+k.toUpperCase());if(!el)continue;const m=CTL_SZ[L[k].s]||1,sz=Math.round(CTL_BASE[k]*m);
    const q=ctlPos(L[k],W,H,mir),x=clamp(q[0],sz/2+4,W-sz/2-4),y=clamp(q[1],sz/2+4,H-sz/2-4);
    el.style.left=Math.round(x-sz/2)+'px';el.style.top=Math.round(y-sz/2)+'px';el.style.right='auto';el.style.bottom='auto';el.style.width=sz+'px';el.style.height=sz+'px';el.style.setProperty('--m',m);}
  const z=$('#joyZone'),j=$('#joy'),kn=$('#joyKnob');
  if(z&&j&&kn){const P=L.joy,jm=CTL_SZ[P.s]||1,js=Math.round(CTL_BASE.joy*jm),q=ctlPos(P,W,H,mir),jx=clamp(q[0],js/2+4,W-js/2-4),jy=clamp(q[1],H*0.3+js/2,H-js/2-4),left=jx<W/2;
    z.style.left=left?'0':'50%';z.style.width='50%';z.style.top='30%';z.style.height='70%';
    MG.joyRest={x:jx-(left?0:W/2),y:jy-H*0.3};MG.joyM=jm;
    j.style.width=j.style.height=js+'px';j.style.margin=(-js/2)+'px 0 0 '+(-js/2)+'px';const ks=Math.round(50*jm);kn.style.width=kn.style.height=ks+'px';kn.style.margin=(-ks/2)+'px 0 0 '+(-ks/2)+'px';
    if(MG.joyRestFn)MG.joyRestFn();}
  MG.ctlG=g;}
let CTL_SIG='';
function ctlSwapAnim(){const b=document.querySelector('#mvStage .btns');if(!b)return;b.classList.remove('ctl-sw');void b.offsetWidth;b.classList.add('ctl-sw');}
function ctlLabels(){let acts=null;try{if(typeof mgActs==='function')acts=mgActs();}catch(e){}if(!Array.isArray(acts))return;
  const sig=JSON.stringify(acts);if(sig===CTL_SIG)return;CTL_SIG=sig;const by={};for(const x of acts)if(x&&x.k)by[x.k]=x;
  for(const k of ['a','b','c','d']){const el=document.getElementById('btn'+k.toUpperCase());if(!el)continue;const x=by[k],l=x?String(x.label||''):'';el.classList.toggle('off',!x);
    el.innerHTML=x?`<span${l.length>5?' class="long"':''}>${esc(l)}</span>${x.sub?`<small>${esc(x.sub)}</small>`:''}`:'';el.setAttribute('aria-label',l);}
  ctlSwapAnim();}
function ctlHints(){try{for(const k of ['a','b','c','d']){const el=document.getElementById('btn'+k.toUpperCase());if(el)el.dataset.key=ctlBtnKey(k);}
  const p=document.querySelector('#mgTut .tut-card p');const K=ctlKeys(),L=a=>ctlLbl(K[a][0]);
  if(p)p.textContent=`Klavyede: ${L('up')} ${L('left')} ${L('down')} ${L('right')} ile koş, ${L('a')} A (şut), ${L('b')} B (pas), ${L('c')} C (koş/çalım), ${L('spr')} depar, ${L('d')} D. ${L('pause')} duraklatır. Tuşları Ayarlar → Kontroller’den değiştirebilirsin.`;}catch(e){}}
padCtx=(old=>function(){const pk=MG.padK;const r=old.apply(this,arguments);try{if(!MG.S)return r;
  if(MG.padK!==pk){CTL_SIG='';if(pk!=null)ctlSwapAnim();}
  const g=ctlCtxNow();if(g!==MG.ctlG)ctlApply(g);ctlLabels();}catch(e){}return r;})(padCtx);
function ctlCmd(a){const S=MG.S,live=S&&!$('#mvStage').hidden;
  if(a==='pause'){if(!live||!$('#mgTut').hidden||S.phase==='end'||S.phase==='replay')return false;S.paused=!S.paused;
    if(S.paused){resetInput();mgFlash('DURAKLATILDI\n'+ctlLbl(ctlKeys().pause[0])+' ile devam','',0);}else{$('#mgFlash').className='mg-flash';MG.last=0;}return true;}
  if(a==='next'){if(live){if(S.phase==='replay'){IN.q.push({b:'a',type:'d'});return true;}if(S.phase==='end'){S.endT=Math.min(S.endT,0.01);return true;}return false;}
    if(typeof MR!=='undefined'&&MR&&!MR.mgr){const f=$('#mvFast');if(f&&!f.hidden){MR.fast=true;MR.__nx=1;f.textContent='Normal hız';return true;}}return false;}
  if(a==='fast'){const f=$('#mvFast');if(f&&!f.hidden&&!$('#match').hidden){f.click();return true;}return false;}
  return false;}
/* anlatım ekranında (an açık değilken) Sonraki an / Hızlandır; v130 Space kısayolundan önce çalışır */
window.addEventListener('keydown',e=>{if(CTLU.wait||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const t=e.target;if(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable))return;
  const m=$('#match');if(!m||m.hidden||(MG.S&&!$('#mvStage').hidden))return;const a=ctlKeyAct(e);if(a!=='next'&&a!=='fast')return;
  if(ctlCmd(a)){e.preventDefault();e.stopImmediatePropagation();}},true);

/* ---------- başlık kartı ve hoca rozeti ---------- */
const MG_CARD={atak:['Şut fırsatı','Ceza sahası önünde top sende'],kontra:['Kontra atak','Önün açık, hızlı karar ver'],savunma:['Rakip atak','Topu kazan, kaleni koru'],
  savunma_geri:['Geri dönüş','Rakip hızlandı; yetiş ve topu al'],penalti:['Penaltı','Kaleciyle karşı karşıya'],serbest:['Serbest vuruş','Duvarı aş, köşeyi bul'],
  korner_take:['Korner','Ortayı sen yapıyorsun'],korner_box:['Korner','Ceza sahasında boşa çık, kafayı vur'],korner:['Korner','Ceza sahasında pozisyon al'],dkorner:['Rakip korner','Adamını bırakma, topu uzaklaştır'],
  drill:['Şut çalışması','Antrenman'],tr_kos:['Koni parkuru','Antrenman'],tr_top:['Top sürme parkuru','Antrenman']};
function mgCardShow(type,C,title){const st=$('#mvStage');if(!st)return;let el=$('#mgCard');if(!el){el=document.createElement('div');el.id='mgCard';el.className='mg-card';st.appendChild(el);}
  let info=null;try{if(typeof mgCardInfo==='function')info=mgCardInfo(type,C);}catch(e){}
  const M=MG_CARD[type+'_'+((C&&C.sub)||'')]||MG_CARD[type]||[(typeof CH_NAME!=='undefined'&&CH_NAME[type])||'Pozisyon',''];
  const t=(info&&info.t)||M[0],s=(info&&info.s!=null)?info.s:M[1],mn=(String(title||'').match(/^(\d+)’/)||[])[1];
  el.innerHTML=`<i class="mc-bar"></i><div class="mc-in">${mn?`<em>${mn}’</em>`:''}<b>${esc(t)}</b>${s?`<small>${esc(s)}</small>`:''}</div>`;
  el.classList.toggle('low',CAMV.s<0);el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(MG.cardT);MG.cardT=setTimeout(()=>el.classList.remove('show'),2100);}
function mgCoachChip(txt,ms){const st=$('#mvStage');if(!st)return;let el=$('#mgCoach');if(!el){el=document.createElement('div');el.id='mgCoach';el.className='mg-coach';st.appendChild(el);}
  clearTimeout(MG.coachT);if(!txt){el.classList.remove('show');return;}el.innerHTML=`<i>HOCA</i><span>${esc(txt)}</span>`;el.classList.add('show');if(ms!==0)MG.coachT=setTimeout(()=>el.classList.remove('show'),ms||4200);}
hudUpdate=(old=>function(){const r=old.apply(this,arguments);try{const S=MG.S;if(S){const t=typeof S.coach==='string'?S.coach:'';if(t!==MG.coachTxt){MG.coachTxt=t;mgCoachChip(t,0);}}}catch(e){}return r;})(hudUpdate);

startMoment=(old=>function(type,C,title,done){const r=old.apply(this,arguments);
  try{if(typeof MR!=='undefined'&&MR&&MR.__nx){MR.__nx=0;MR.fast=false;const f=$('#mvFast');if(f)f.textContent='Hızlandır';}}catch(e){}
  try{if(MG.S&&!$('#mvStage').hidden){MG.ctlG=null;CTL_SIG='';MG.coachTxt='';mgCoachChip('');MG.cv={x:0,y:0};MG.la={x:0,y:0};MG.ts=1;MG.zoom=1;MG.slowT=0;MG.trail=[];
    camMode();if(MG.f0)MG.f=MG.f0*(CAMV.s<0?GKC.f:1);const t=camTarget();MG.cam.x=t.x;MG.cam.y=t.y;ctlApply(ctlCtxNow());ctlHints();mgCardShow(type,C,title);$('#mgFlash').className='mg-flash';}}catch(e){console.warn(e);}
  return r;})(startMoment);

/* ---------- Ayarlar → Kontroller penceresi ---------- */
const CTLU={pane:'touch',g:'atk',sel:'a',wait:null,k:190/412};
const CTL_LBL={atk:{a:['ŞUT','basılı: güç'],b:['PAS','tut: ara pas'],c:['KOŞ','dokun: çalım'],d:null},def:{a:['KAY','kayarak'],b:['MÜDAHALE','ayakta'],c:['KOŞ',''],d:['PRES','basılı tut']},
  gk:{a:['DALIŞ','yön + bas'],b:['ÇIK','kapat'],c:['KOŞ',''],d:['YAKALA','']}};
function ctlLblFor(g){try{if(typeof mgActsFor==='function'){const A=mgActsFor(g);if(Array.isArray(A)){const o={a:null,b:null,c:null,d:null};for(const x of A)if(x&&x.k)o[x.k]=[String(x.label||''),x.sub||''];return o;}}}catch(e){}return CTL_LBL[g];}
function ctlMean(a){const f=s=>s.charAt(0)+s.slice(1).toLocaleLowerCase('tr-TR');
  if(CTL_MV[a])return 'Koşu yönü (joystick)';if(a==='spr')return 'Basılı tut: depar (C ile aynı düğme)';if(a==='pause')return 'Anı dondurur / sürdürür';if(a==='next')return 'Tekrarı geçer; anlatımda sonraki ana hızla gider';if(a==='fast')return 'Anlatımı hızlandırır';
  return CTL_CTX.map(g=>{const l=ctlLblFor(g)[a];return `${{atk:'Topla',def:'Rakipte',gk:'Kaleci'}[g]}: ${l?f(l[0]):'—'}`;}).join(' · ');}
function ctlElHTML(k,L,lb,mir,sel){const isJ=k==='joy',P=L[k],m=CTL_SZ[P.s]||1,sz=Math.round(CTL_BASE[k]*m),x=clamp((mir?1-P.x:P.x)*412,sz/2+2,410-sz/2),y=clamp(P.y*860,140+sz/2,858-sz/2),l=isJ?null:lb[k];
  return `<div class="ctl-el ${isJ?'ctl-j':'lb-'+k}${sel===k?' sel':''}${!isJ&&!l?' none':''}" data-k="${k}" style="left:${Math.round(x-sz/2)}px;top:${Math.round(y-sz/2)}px;width:${sz}px;height:${sz}px">${isJ?'<i></i>':`<span>${l?esc(l[0]):'boş'}</span>${l&&l[1]?`<small>${esc(l[1])}</small>`:''}`}</div>`;}
function ctlSideHTML(){const C=ctlCfg(),L=C.ctx[CTLU.g],P=L[CTLU.sel],lb=ctlLblFor(CTLU.g),nm=CTLU.sel==='joy'?'Joystick':`${CTLU.sel.toUpperCase()} · ${lb[CTLU.sel]?lb[CTLU.sel][0]:'bu durumda boş'}`;
  return `<p class="ctl-selname">Seçili: <b>${esc(nm)}</b></p>
  <div class="ctl-row"><span>Boyut</span><div class="seg">${['S','M','L'].map(s=>`<button class="chip" aria-pressed="${P.s===s}" data-act="ctlSz" data-s="${s}">${{S:'Küçük',M:'Orta',L:'Büyük'}[s]}</button>`).join('')}</div></div>
  <div class="ctl-row"><span>Saydamlık</span><input type="range" id="ctlOp" min="30" max="100" step="5" value="${Math.round(L.op*100)}" aria-label="Saydamlık"><em id="ctlOpV">%${Math.round(L.op*100)}</em></div>
  <div class="ctl-row"><span>Joystick</span><div class="seg">${[['R','Solda'],['L','Sağda']].map(([k,l])=>`<button class="chip" aria-pressed="${C.hand===k}" data-act="ctlHand" data-k="${k}">${l}</button>`).join('')}</div></div>
  <div class="ctl-row"><span>Tür</span><div class="seg">${[['float','Serbest'],['fixed','Sabit']].map(([k,l])=>`<button class="chip" aria-pressed="${C.joy===k}" data-act="ctlJoy" data-k="${k}">${l}</button>`).join('')}</div></div>
  <p class="muted ctl-note">${C.joy==='fixed'?'Sabit: joystick yerinde durur; kendi yarında nereye dokunsan onu yönetirsin.':'Serbest: joystick kendi yarında dokunduğun yerde açılır, parmağını izler.'} Düğmeler bu durum değişince (top kazanılınca/kaybedilince) kayarak bu yerlere geçer.</p>`;}
function openControls(){const C=ctlCfg(),g=CTLU.g,mir=C.hand==='L',K=ctlKeys();let body='';
  if(CTLU.pane==='touch'){const L=C.ctx[g],lb=ctlLblFor(g);
    body=`<div class="filt ctl-ctx">${CTL_CTX.map(k=>`<button class="chip" data-act="ctlG" data-k="${k}" aria-pressed="${g===k}">${CTL_GN[k]}</button>`).join('')}</div>
    <div class="ctl-wrap"><div class="ctl-ph" style="width:${Math.round(412*CTLU.k)}px;height:${Math.round(860*CTLU.k)}px"><div class="ctl-scr" id="ctlScr" style="transform:scale(${CTLU.k});--op:${L.op}">
      <div class="ctl-pitch"></div><div class="ctl-hud"><i></i><div><b>${esc(CTL_GN[g])}</b><em></em></div></div><div class="ctl-zone${C.hand==='L'?' r':''}"></div>
      ${['joy','c','b','a','d'].map(k=>ctlElHTML(k,L,lb,mir,CTLU.sel)).join('')}</div></div>
      <div class="ctl-side" id="ctlSide">${ctlSideHTML()}</div></div>
    <div class="offer-btns"><button class="btn" data-act="ctlReset">Bu düzeni sıfırla</button><button class="btn" data-act="ctlCopy">Diğer durumlara kopyala</button></div>
    <label class="hurt" style="margin:0"><input type="checkbox" data-act="ctlSlow" ${C.slow?'checked':''}> Şut anlarında ağır çekim ve yakınlaşma</label>
    <p class="muted" style="margin:0;font-size:12.5px">Duran toplar “Topa sahipken”, kaleci anları “Kaleciyken” düzenini kullanır. Önizlemede düğmeye dokun, sürükle; boyut ve saydamlığı sağdan seç.</p>`;}
  else{const used={};for(const [a] of CTL_ACTS)for(const c of K[a])if(c)used[c]=(used[c]||0)+1;
    body=`<p class="muted" style="margin:0;font-size:12.5px">Bir tuşa tıkla, sonra klavyede yeni tuşa bas. Esc vazgeçer, Geri/Delete o kutuyu boşaltır. Başka eylemde kullanılan tuşu seçersen ikisi yer değiştirir. A–D düğmelerinin anlamı duruma göre değişir; Pro maçta da aynı tuşlar geçerlidir.</p>
    <div class="ctl-keys">${CTL_ACTS.map(([a,n])=>{const none=!K[a][0]&&!K[a][1],dup=K[a].some(c=>c&&used[c]>1);
      return `<div class="ctl-kr${none||dup?' bad':''}"><div class="ctl-kn"><b>${n}</b><small>${esc(ctlMean(a))}${none?' · <u>tuşsuz</u>':''}</small></div><div class="ctl-kb">${[0,1].map(i=>{const w=CTLU.wait&&CTLU.wait.a===a&&CTLU.wait.i===i;
        return `<button class="ctl-key${w?' wait':''}${K[a][i]?'':' empty'}" data-act="ctlKey" data-a="${a}" data-i="${i}">${w?'Tuşa bas…':K[a][i]?esc(ctlLbl(K[a][i])):'+'}</button>`;}).join('')}</div></div>`;}).join('')}</div>
    <div class="offer-btns"><button class="btn" data-act="ctlKeyReset">Varsayılan tuşlar</button></div>`;}
  const html=`<div class="ctl-box"><div class="ctl-h"><button class="btn sm" data-act="ctlBack">‹ Ayarlar</button><h3>Kontroller</h3></div>
    <div class="seg ctl-pane">${[['touch','Dokunmatik düzen'],['keys','Klavye tuşları']].map(([k,l])=>`<button class="chip" aria-pressed="${CTLU.pane===k}" data-act="ctlPane" data-k="${k}">${l}</button>`).join('')}</div>${body}
    <div class="offer-btns"><button class="cta sm" data-act="closeModal">Tamam</button></div></div>`;
  const mc=$('#modalCard');if(mc&&!$('#modal').hidden&&mc.querySelector('.ctl-box')){const sc=mc.scrollTop;mc.innerHTML=html;mc.scrollTop=sc;}else openModal(html);
  ctlBind();}
function ctlSel(k){CTLU.sel=k;const scr=$('#ctlScr');if(scr)scr.querySelectorAll('.ctl-el').forEach(e=>e.classList.toggle('sel',e.dataset.k===k));const sd=$('#ctlSide');if(sd){sd.innerHTML=ctlSideHTML();ctlBindOp();}}
function ctlBindOp(){const r=$('#ctlOp');if(!r)return;r.addEventListener('input',()=>{const C=ctlCfg(),v=clamp(+r.value,30,100)/100;C.ctx[CTLU.g].op=v;const s=$('#ctlScr');if(s)s.style.setProperty('--op',v);const e=$('#ctlOpV');if(e)e.textContent='%'+Math.round(v*100);ctlSave();});}
function ctlBind(){ctlBindOp();const scr=$('#ctlScr');if(!scr)return;const k=CTLU.k;
  scr.querySelectorAll('.ctl-el').forEach(el=>{let pid=null,sx=0,sy=0,l0=0,t0=0,moved=false;
    el.addEventListener('pointerdown',e=>{if(pid!==null)return;pid=e.pointerId;try{el.setPointerCapture(pid);}catch(_){}sx=e.clientX;sy=e.clientY;l0=parseFloat(el.style.left);t0=parseFloat(el.style.top);moved=false;el.classList.add('drag');if(CTLU.sel!==el.dataset.k)ctlSel(el.dataset.k);e.preventDefault();});
    el.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;const dx=(e.clientX-sx)/k,dy=(e.clientY-sy)/k;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;const s=el.offsetWidth;el.style.left=clamp(l0+dx,2,410-s)+'px';el.style.top=clamp(t0+dy,140,858-s)+'px';});
    const up=e=>{if(e.pointerId!==pid)return;pid=null;el.classList.remove('drag');if(!moved)return;const s=el.offsetWidth,C=ctlCfg(),P=C.ctx[CTLU.g][el.dataset.k];let x=(parseFloat(el.style.left)+s/2)/412;if(C.hand==='L')x=1-x;
      P.x=+clamp(x,0.03,0.97).toFixed(4);P.y=+clamp((parseFloat(el.style.top)+s/2)/860,0.1,0.98).toFixed(4);ctlSave();};
    el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);});}
ACTX.ctlOpen=()=>{CTLU.wait=null;openControls();};
ACTX.ctlBack=()=>{CTLU.wait=null;openSettings();};
ACTX.ctlPane=el=>{CTLU.pane=el.dataset.k;CTLU.wait=null;openControls();};
ACTX.ctlG=el=>{CTLU.g=el.dataset.k;openControls();};
ACTX.ctlSz=el=>{const P=ctlCfg().ctx[CTLU.g][CTLU.sel];if(P&&CTL_SZ[el.dataset.s]){P.s=el.dataset.s;ctlSave();}openControls();};
ACTX.ctlHand=el=>{ctlCfg().hand=el.dataset.k==='L'?'L':'R';ctlSave();openControls();};
ACTX.ctlJoy=el=>{ctlCfg().joy=el.dataset.k==='fixed'?'fixed':'float';ctlSave();openControls();};
ACTX.ctlReset=()=>{ctlCfg().ctx[CTLU.g]=ctlDefCtx();ctlSave();openControls();toast(`“${CTL_GN[CTLU.g]}” düzeni varsayılana döndü`);};
ACTX.ctlCopy=()=>{const C=ctlCfg(),src=JSON.stringify(C.ctx[CTLU.g]);for(const g of CTL_CTX)if(g!==CTLU.g)C.ctx[g]=JSON.parse(src);ctlSave();toast(`“${CTL_GN[CTLU.g]}” düzeni diğer iki duruma da uygulandı`);};
ACTX.ctlSlow=el=>{ctlCfg().slow=!!el.checked;ctlSave();};
ACTX.ctlKey=el=>{const a=el.dataset.a,i=+el.dataset.i;CTLU.wait=(CTLU.wait&&CTLU.wait.a===a&&CTLU.wait.i===i)?null:{a,i};openControls();};
ACTX.ctlKeyReset=()=>{CTLK=null;CTLKL={};CTLR=null;try{localStorage.removeItem(CTL_KS);}catch(e){}CTLU.wait=null;openControls();toast('Varsayılan tuşlar geri geldi');};
/* tuş yakalama: pencere yakalama aşamasında, v130 Space/Esc kısayollarından ve maç dinleyicilerinden önce */
window.addEventListener('keydown',e=>{if(!CTLU.wait)return;const mc=$('#modalCard');if($('#modal').hidden||!mc||!mc.querySelector('.ctl-box')){CTLU.wait=null;return;}
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;const w=CTLU.wait;CTLU.wait=null;
  if(e.key==='Escape'){openControls();return;}const K=ctlKeys();
  if(e.key==='Backspace'||e.key==='Delete'){if(w.i===1)K[w.a][1]=null;else if(K[w.a][1]){K[w.a]=[K[w.a][1],null];}else{toast('Her eylemin en az bir tuşu olmalı');openControls();return;}ctlKSave();openControls();return;}
  const code=ctlCode(e);if(e.key&&e.key.length===1)CTLKL[code]=e.key===' '?'Boşluk':e.key.toLocaleUpperCase('tr-TR');
  const prev=K[w.a][w.i];let msg='';
  for(const [b] of CTL_ACTS)for(let j=0;j<2;j++){if(K[b][j]!==code||(b===w.a&&j===w.i))continue;
    if(b===w.a){K[b][j]=null;continue;}K[b][j]=prev||null;if(!K[b][0]&&K[b][1])K[b]=[K[b][1],null];
    msg=prev?`${ctlLbl(code)} “${CTL_AN[b]}” eylemindeydi; ${ctlLbl(prev)} ile yer değiştirdiler.`:`${ctlLbl(code)} “${CTL_AN[b]}” eyleminden alındı.${!K[b][0]?' Bu eylem şimdi tuşsuz!':''}`;}
  K[w.a][w.i]=code;if(!K[w.a][0]&&K[w.a][1])K[w.a]=[K[w.a][1],null];ctlKSave();openControls();if(msg)toast(msg);},true);

/* ================= modern an görünümü ================= */
function camMode(){const S=MG.S;let gk=false;try{gk=!!MG.forceFlip||(typeof mgCtx==='function'&&mgCtx()==='gk')||!!(S&&S.hero&&S.hero.isGK);}catch(e){}
  if(gk)camSet(GKC.h,GKC.b,-1);else camSet(CAM_H,CAM_B,1);MG.flip=gk;}
camTarget=(old=>function(){const S=MG.S;if(CAMV.s<0&&S&&S.ball){const b=S.ball;return {x:clamp(34+(b.x-34)*0.32,28,40),y:GKC.look};}return old.apply(this,arguments);})(camTarget);
camStep=function(dt){const S=MG.S,t=camTarget();MG.cv=MG.cv||{x:0,y:0};MG.la=MG.la||{x:0,y:0};
  let lx=0,ly=0;if(S&&S.ball&&S.phase==='play'&&(S.mode==='atk'||S.mode==='def'||S.mode==='cp')&&CAMV.s>0){const b=S.ball;lx=clamp(b.vx*0.16,-2.6,2.6);ly=clamp(b.vy*0.1,-2,2);}
  const kl=1-Math.pow(0.08,dt);MG.la.x+=(lx-MG.la.x)*kl;MG.la.y+=(ly-MG.la.y)*kl;
  const tx=t.x+MG.la.x,ty=clamp(t.y+MG.la.y,CAMV.s>0?5:0,CAMV.s>0?60:30),w=6.2;
  MG.cv.x+=(w*w*(tx-MG.cam.x)-2*w*MG.cv.x)*dt;MG.cv.y+=(w*w*(ty-MG.cam.y)-2*w*MG.cv.y)*dt;MG.cam.x+=MG.cv.x*dt;MG.cam.y+=MG.cv.y*dt;
  MG.shake*=Math.pow(0.02,dt);
  const zt=MG.ts<0.9?1.12:1;MG.zoom=(MG.zoom||1)+(zt-(MG.zoom||1))*(1-Math.pow(0.02,dt));if(MG.f0)MG.f=MG.f0*MG.zoom*(CAMV.s<0?GKC.f:1);};
function slowWant(){const S=MG.S;if(!S||!ctlCfg().slow)return 1;const b=S.ball;
  if(S.phase==='play'&&b&&b.kind==='shot'&&!b.owner&&!b.held&&b.vy<-4&&b.y<17&&b.y>-0.3){if(MG.slowK!==b.lastT){MG.slowK=b.lastT;MG.slowT=0;}return MG.slowT<1.2?0.4:1;}
  if(S.phase==='end'&&S.res&&S.res.code==='goal'&&S.endT>2.1)return 0.55;return 1;}
mgLoop=function(ts){if(!MG.S)return;const dt=MG.last?Math.min(0.05,(ts-MG.last)/1000):0;MG.last=ts;
  const want=slowWant();MG.ts=MG.ts==null?1:MG.ts+(want-MG.ts)*Math.min(1,dt*9);if(MG.ts<0.9)MG.slowT=(MG.slowT||0)+dt;MG.acc+=dt*MG.ts;
  while(MG.acc>=1/120&&MG.S){mgStep(1/120);MG.acc-=1/120;}
  if(MG.S){mgDraw();hudUpdate();MG.raf=requestAnimationFrame(mgLoop);}};

/* sabit katmanlar: gökyüzü, ışık, vinyet, çim dokusu, gölge ve parlama sprite'ları */
function mkCv(w,h){const v=document.createElement('canvas');v.width=w;v.height=h;return v;}
mgSetup=(old=>function(){const r=old.apply(this,arguments);try{vxSetup();}catch(e){console.warn(e);}return r;})(mgSetup);
function vxSetup(){const W=MG.W,H=MG.H,c=MG.ctx,d=MG.dpr;MG.f0=MG.f;MG.zoom=MG.zoom||1;
  const g=c.createLinearGradient(0,0,0,H*0.5);g.addColorStop(0,'#03060b');g.addColorStop(0.55,'#08131c');g.addColorStop(1,'#0d1d1b');MG.sky=g;
  const v=mkCv(Math.round(W*d),Math.round(H*d)),vc=v.getContext('2d');vc.scale(d,d);
  const rg=vc.createRadialGradient(W/2,H*0.46,Math.min(W,H)*0.32,W/2,H*0.46,Math.max(W,H)*0.8);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(0.7,'rgba(0,0,0,.22)');rg.addColorStop(1,'rgba(0,0,0,.6)');vc.fillStyle=rg;vc.fillRect(0,0,W,H);
  const tg=vc.createLinearGradient(0,0,0,H*0.2);tg.addColorStop(0,'rgba(0,0,0,.45)');tg.addColorStop(1,'rgba(0,0,0,0)');vc.fillStyle=tg;vc.fillRect(0,0,W,H*0.2);
  for(const x of [W*0.04,W*0.96]){const lg=vc.createRadialGradient(x,-H*0.01,0,x,-H*0.01,W*0.75);lg.addColorStop(0,'rgba(255,248,228,.3)');lg.addColorStop(0.35,'rgba(255,248,228,.08)');lg.addColorStop(1,'rgba(255,248,228,0)');vc.fillStyle=lg;vc.fillRect(0,0,W,H);}
  /* ışık havuzu ve çim dokusu da vinyet katmanına işlenir: tam ekran karışım sayısı artmaz (yazılımsal çizimde pahalı) */
  const lr=vc.createRadialGradient(W/2,H*0.62,0,W/2,H*0.62,Math.max(W,H)*0.7);lr.addColorStop(0,'rgba(255,255,236,.06)');lr.addColorStop(1,'rgba(255,255,236,0)');vc.fillStyle=lr;vc.fillRect(0,0,W,H);
  if(!MG.noiseCv){const n=mkCv(128,128),nc=n.getContext('2d');for(let i=0;i<2400;i++){const L=Math.random()<0.5;nc.fillStyle=L?'rgba(220,255,200,.035)':'rgba(0,20,0,.06)';nc.fillRect((Math.random()*128)|0,(Math.random()*128)|0,Math.random()<0.3?2:1,1);}MG.noiseCv=n;}
  {const pt=vc.createPattern(MG.noiseCv,'repeat'),hz=H*0.3;vc.fillStyle=pt;vc.fillRect(0,hz,W,H-hz);}
  MG.vig=v;MG.lit=null;
  if(!MG.shSpr){const s=mkCv(64,32),sc=s.getContext('2d'),sg=sc.createRadialGradient(32,16,0,32,16,32);sg.addColorStop(0,'rgba(0,0,0,.85)');sg.addColorStop(0.55,'rgba(0,0,0,.4)');sg.addColorStop(1,'rgba(0,0,0,0)');sc.setTransform(1,0,0,0.5,0,8);sc.fillStyle=sg;sc.fillRect(0,0,64,64);MG.shSpr=s;
    const gl=mkCv(96,96),gc=gl.getContext('2d'),gg=gc.createRadialGradient(48,48,0,48,48,48);gg.addColorStop(0,'rgba(255,255,245,1)');gg.addColorStop(0.18,'rgba(255,250,225,.55)');gg.addColorStop(1,'rgba(255,240,200,0)');gc.fillStyle=gg;gc.fillRect(0,0,96,96);MG.glow=gl;}
  if(MG.S){MG.ctlG=null;}}

/* tribünler: katlar, LED şerit, çatı, projektörler, seyirci (baş + gövde) */
const vY=y=>CAMV.s<0?105-y:y;
function standEnd(c,ys){const P=(x,y,z)=>[x,ys(y),z];
  for(let i=0;i<6;i++){const v0=i/6,v1=(i+1)/6;fillPoly(c,[P(-16,-6.5-25.5*v0,1.3+15.7*v0),P(84,-6.5-25.5*v0,1.3+15.7*v0),P(84,-6.5-25.5*v1,1.3+15.7*v1),P(-16,-6.5-25.5*v1,1.3+15.7*v1)],i%2?'#0c1720':'#101e29');}
  fillPoly(c,[P(-16,-32,17),P(84,-32,17),P(84,-28.5,19.6),P(-16,-28.5,19.6)],'#04080c');}
function standSide(c,s){const x0=s<0?-5.5:73.5,x1=s<0?-28:96,yA=-6.5,yB=CAMV.s<0?111.5:76;
  for(let i=0;i<4;i++){const v0=i/4,v1=(i+1)/4,xa=x0+(x1-x0)*v0,xb=x0+(x1-x0)*v1,za=1.3+13.7*v0,zb=1.3+13.7*v1;fillPoly(c,[[xa,yA,za],[xa,yB,za],[xb,yB,zb],[xb,yA,zb]],i%2?'#0a141c':'#0e1a24');}}
function ledRibbon(c,t){const S=MG.S,cols=[S.C.us.c1||'#c8102e',S.C.opp.c1||'#173a8a','#ffb320'];const y=-6.5-25.5*0.36,z=1.3+15.7*0.36;
  const A=proj(-16,vY(y),z),B=proj(84,vY(y),z);if(!A||!B)return;const g=c.createLinearGradient(A.x,0,B.x,0),o=(t*0.08)%1;
  for(let i=0;i<=6;i++){const p=(i/6+o)%1;g.addColorStop(p,cols[i%3]);}fillPoly(c,[[-16,vY(y),z],[84,vY(y),z],[84,vY(y-0.4),z+0.55],[-16,vY(y-0.4),z+0.55]],g);}
drawStands=function(c){const S=MG.S,fl=CAMV.s<0,t=S.t;
  standEnd(c,fl?(y=>105-y):(y=>y));standSide(c,-1);standSide(c,1);ledRibbon(c,t);
  if(fl&&MG._cw!==MG.crowd){MG._cw=MG.crowd;MG.crowdF=MG.crowd.map(p=>Object.assign({},p,{y:105-p.y}));}
  const wave=S.res&&['goal','assist','tmGoal'].includes(S.res.code),pts=fl?(MG.crowdF||[]):MG.crowd,W=MG.W,H=MG.H;
  for(const p of pts){const z=p.z+(wave?Math.max(0,Math.sin(t*9+p.k))*0.6:Math.sin(t*2+p.k)*0.05);const P=proj(p.x,p.y,z);
    if(!P||P.x<-4||P.x>W+4||P.y<-6||P.y>H)continue;const s=Math.max(1,P.s*0.36);c.fillStyle=p.col;c.fillRect(P.x-s/2,P.y-s*0.9,s,s*1.2);
    if(s>=2.2){c.fillStyle=p.k>3.1?'#d8b08c':'#6b4a33';c.fillRect(P.x-s*0.28,P.y-s*1.45,s*0.56,s*0.52);}}
  /* projektör direkleri */
  const ye=fl?115:-36;c.globalCompositeOperation='lighter';
  for(const x of [-10,78]){const P=proj(x,ye,27);if(!P||P.x<-80||P.x>W+80||P.y<-80||P.y>H)continue;const r=clamp(P.s*4,14,44);c.globalAlpha=0.6;c.drawImage(MG.glow,P.x-r,P.y-r,r*2,r*2);
    c.globalAlpha=1;c.fillStyle='#fffbe8';const q=Math.max(1.6,r*0.05);for(let i=-2;i<=2;i++)for(let j=0;j<2;j++)c.fillRect(P.x+i*q*2.2-q/2,P.y+j*q*2.2-q,q,q);}
  c.globalCompositeOperation='source-over';c.globalAlpha=1;};

/* saha: biçme şeritleri, doku, ışık havuzu, tribün gölgesi, çizgiler */
function pitchEnd(c,E,s){const Y=d=>E+s*d;
  lineW(c,13.84,Y(0),13.84,Y(16.5));lineW(c,54.16,Y(0),54.16,Y(16.5));lineW(c,13.84,Y(16.5),54.16,Y(16.5));
  lineW(c,24.84,Y(0),24.84,Y(5.5));lineW(c,43.16,Y(0),43.16,Y(5.5));lineW(c,24.84,Y(5.5),43.16,Y(5.5));
  if(s>0){arcW(c,34,Y(11),9.15,0.6448,Math.PI-0.6448,24);arcW(c,0,Y(0),1,0,Math.PI/2,4);arcW(c,68,Y(0),1,Math.PI/2,Math.PI,4);}
  else{arcW(c,34,Y(11),9.15,Math.PI+0.6448,2*Math.PI-0.6448,24);arcW(c,0,Y(0),1,-Math.PI/2,0,4);arcW(c,68,Y(0),1,Math.PI,1.5*Math.PI,4);}
  const P=proj(34,Y(11),0);if(P){c.fillStyle='#fff';c.beginPath();c.ellipse(P.x,P.y,Math.max(1.5,0.22*P.s),Math.max(1,0.13*P.s),0,0,7);c.fill();}}
drawPitch=function(c){const fl=CAMV.s<0,Ln=fl?105:77,Y1=fl?111.5:78,cy=MG.cam.y;
  fillPoly(c,[[-5.4,-6.5,0],[73.4,-6.5,0],[73.4,Y1,0],[-5.4,Y1,0]],'#174a2d');
  for(let i=0;i*5.5<Ln;i++){const y0=i*5.5,y1=Math.min(Ln,y0+5.5);if(fl&&y1<cy-GKC.b-2)continue;fillPoly(c,[[0,y0,0],[68,y0,0],[68,y1,0],[0,y1,0]],i%2?'#2b7542':'#358750');}
  c.globalAlpha=0.05;for(let i=1;i<6;i+=2){const x0=i*11.33;fillPoly(c,[[x0,0,0],[x0+11.33,0,0],[x0+11.33,Ln,0],[x0,Ln,0]],'#ffffff');}c.globalAlpha=1;
  fillPoly(c,[[-5.4,vY(-6.5),0],[73.4,vY(-6.5),0],[73.4,vY(1.5),0],[-5.4,vY(1.5),0]],'rgba(0,0,0,.14)');
  fillPoly(c,[[-5.4,vY(1.5),0],[73.4,vY(1.5),0],[73.4,vY(5),0],[-5.4,vY(5),0]],'rgba(0,0,0,.06)');
  if(MG.lit)c.drawImage(MG.lit,0,0,MG.W,MG.H);
  c.strokeStyle='rgba(250,252,247,.9)';c.lineCap='round';
  lineW(c,0,0,68,0);lineW(c,0,0,0,Ln);lineW(c,68,0,68,Ln);pitchEnd(c,0,1);
  lineW(c,0,52.5,68,52.5);arcW(c,34,52.5,9.15,0,Math.PI*2,64);{const P=proj(34,52.5,0);if(P){c.fillStyle='#fff';c.beginPath();c.ellipse(P.x,P.y,Math.max(1.5,0.22*P.s),Math.max(1,0.13*P.s),0,0,7);c.fill();}}
  if(fl){lineW(c,0,105,68,105);pitchEnd(c,105,-1);}};
drawBoards=function(c,byF){BOARD_TXT[0]=trUp(PN());const fl=CAMV.s<0,t=MG.S.t,cols=['#c8102e','#173a8a','#ffb320','#0f7b3a'],by=byF!=null?byF:fl?109.2:-4.2,sh=Math.floor(t/5);c.textAlign='center';c.textBaseline='middle';
  for(let i=0;i<8;i++){const x0=-2+i*9,ci=(i+sh)%4,col=cols[ci];fillPoly(c,[[x0,by,0],[x0+9,by,0],[x0+9,by,0.9],[x0,by,0.9]],col);
    fillPoly(c,[[x0,by,0.82],[x0+9,by,0.82],[x0+9,by,0.9],[x0,by,0.9]],'rgba(255,255,255,.35)');
    const A=proj(x0+4.5,by,0.45),T=proj(x0+4.5,by,0.9);if(A&&T){const h=A.y-T.y;if(h>3.5){c.font=`800 ${Math.round(h*1.15)}px "Saira Extra Condensed",sans-serif`;c.fillStyle=col==='#ffb320'?'#1d1300':'#ffffff';c.fillText(BOARD_TXT[(i+sh)%BOARD_TXT.length],A.x,A.y+1);}}}
  if(byF!=null)return;const y0s=fl?30:-4,y1s=fl?110:76;for(const sx of [-3.2,71.2])for(let y0=y0s,i=0;y0<y1s;y0+=10,i++)fillPoly(c,[[sx,y0,0],[sx,y0+10,0],[sx,y0+10,0.9],[sx,y0,0.9]],cols[(i+sh+(sx<0?1:2))%4]);};
function drawFarGoal(c){const D=107;c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=1;fillPoly(c,[[GL,D,0],[GR,D,0],[GR,D,2.1],[GL,D,2.1]],'rgba(240,240,240,.07)');
  c.strokeStyle='#f2f2f2';c.lineCap='round';segW(c,GL,105,0,GL,105,GH,0.13);segW(c,GR,105,0,GR,105,GH,0.13);segW(c,GL,105,GH,GR,105,GH,0.13);}

/* oyuncu gölgeleri (projektörler: dört yumuşak gölge) ve “sen” halkası */
drawShadow=function(c,e){const P=proj(e.x,e.y,0);if(!P)return;const s=P.s,S=MG.S;if(P.y<-30||P.y>MG.H+40||P.x<-80||P.x>MG.W+80)return;const sp=MG.shSpr;
  if(sp){if(s>7&&!(e.slide>0||e.down>0)){c.globalAlpha=0.16;const L=1.5*(e.hgt||1);for(const [dx,dy] of [[0.7,-0.7],[-0.7,-0.7],[0.75,0.6],[-0.75,0.6]]){const Q=proj(e.x+dx*L,e.y+dy*L,0);if(!Q)continue;
        const ax=Q.x-P.x,ay=Q.y-P.y,len=Math.hypot(ax,ay);c.save();c.translate((P.x+Q.x)/2,(P.y+Q.y)/2);c.rotate(Math.atan2(ay,ax));c.drawImage(sp,-len*0.62,-s*0.12,len*1.24,s*0.24);c.restore();}}
    c.globalAlpha=0.62;c.drawImage(sp,P.x-s*0.48,P.y-s*0.17,s*0.96,s*0.34);c.globalAlpha=1;}
  if(e.isC){const rx=s*0.62,ry=s*0.24,t=S.t;c.lineWidth=6;c.strokeStyle='rgba(255,186,48,.22)';c.beginPath();c.ellipse(P.x,P.y,rx,ry,0,0,7);c.stroke();
    c.lineWidth=2.2;c.strokeStyle='#ffc23d';c.beginPath();c.ellipse(P.x,P.y,rx,ry,0,0,7);c.stroke();
    const st=S.stam;c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(P.x,P.y,rx*1.3,ry*1.3,0,0,7);c.stroke();
    c.strokeStyle=st>0.5?'#6fd3ff':st>0.25?'#ffd166':'#ff6b5e';c.beginPath();c.ellipse(P.x,P.y,rx*1.3,ry*1.3,0,-Math.PI/2,-Math.PI/2+Math.max(0.01,st)*Math.PI*2);c.stroke();
    const fm=Math.hypot(e.fx,e.fy)||1,Q=proj(e.x+e.fx/fm*1.05,e.y+e.fy/fm*1.05,0);if(Q){const ax=Q.x-P.x,ay=Q.y-P.y,l=Math.hypot(ax,ay)||1,ux=ax/l,uy=ay/l,k=Math.max(4,s*0.13),pu=0.85+0.15*Math.sin(t*6);
      c.fillStyle=`rgba(255,194,61,${pu.toFixed(2)})`;c.beginPath();c.moveTo(Q.x+ux*k,Q.y+uy*k*0.5);c.lineTo(Q.x-uy*k*0.8-ux*k*0.4,Q.y+ux*k*0.4-uy*k*0.2);c.lineTo(Q.x+uy*k*0.8-ux*k*0.4,Q.y-ux*k*0.4-uy*k*0.2);c.closePath();c.fill();}}};
function drawStreak(c,e){const sp=Math.hypot(e.vx,e.vy);if(sp<6.4||e.slide>0||e.down>0)return;const P=proj(e.x,e.y,0),Q=proj(e.x-e.vx*0.17,e.y-e.vy*0.17,0);if(!P||!Q||P.s<9)return;
  const k=Math.min(1,(sp-6.4)/2.4),h=1.12*(e.hgt||1);c.strokeStyle=e.kit.shirt;c.lineCap='round';c.lineWidth=Math.max(1,P.s*0.05);c.globalAlpha=0.3*k;c.beginPath();
  for(const z of [0.55,0.95,1.3]){c.moveTo(P.x+(Q.x-P.x)*0.25,P.y-z*P.s*h);c.lineTo(Q.x,Q.y-z*Q.s*h);}c.stroke();c.globalAlpha=1;}

/* top: gölgeli küre, dönen yamalar, parlama, iz */
drawBall=function(c,b){const P=proj(b.x,b.y,b.z+0.11);if(!P)return;const r=Math.max(2.4,0.115*P.s*1.25);
  c.save();c.translate(P.x,P.y);const g=c.createRadialGradient(-r*0.35,-r*0.4,r*0.1,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(0.6,'#e9edf0');g.addColorStop(1,'#9aa4ad');
  c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();if(r>3.2){c.clip();c.fillStyle='rgba(24,28,36,.85)';
    for(let i=0;i<5;i++){const a=b.rot*0.7+i*1.2566,cz=Math.cos(b.rot*0.45+i*1.9);if(cz<-0.2)continue;c.beginPath();c.ellipse(Math.cos(a)*r*0.6*cz,Math.sin(a)*r*0.6,r*0.24*(0.5+0.5*Math.abs(cz)),r*0.24,a,0,7);c.fill();}
    c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-r*0.36,-r*0.42,r*0.26,r*0.15,-0.6,0,7);c.fill();}
  c.restore();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.beginPath();c.arc(P.x,P.y,r,0,7);c.stroke();};
drawBallShadow=function(c,b){const P=proj(b.x,b.y,0);if(!P||!MG.shSpr)return;const r=Math.max(2.2,0.115*P.s*1.25)*(1+Math.min(1,b.z/4)*0.4);c.globalAlpha=clamp(0.75/(1+b.z*0.45),0.12,0.75);c.drawImage(MG.shSpr,P.x-r*1.3+b.z*0.4,P.y-r*0.6,r*2.6,r*1.2);c.globalAlpha=1;};
function trailStep(b){const T=MG.trail||(MG.trail=[]),v=Math.hypot(b.vx,b.vy,b.vz||0);if(!b.owner&&!b.held&&v>9){const P=proj(b.x,b.y,b.z+0.11);if(P)T.push({x:P.x,y:P.y,r:Math.max(2.4,0.115*P.s*1.25)});if(T.length>10)T.shift();}else if(T.length)T.shift();}
function drawTrail(c){const T=MG.trail;if(!T||T.length<2)return;const n=T.length;for(let i=0;i<n-1;i++){const p=T[i],a=(i+1)/n;c.globalAlpha=a*0.32;c.fillStyle='#ffffff';c.beginPath();c.arc(p.x,p.y,p.r*(0.35+0.6*a),0,7);c.fill();}c.globalAlpha=1;}
/* konfeti: dönen kâğıt etkisi */
drawParts=function(c){const S=MG.S,t=S.t;for(const p of S.parts){const P=proj(p.x,p.y,p.z);if(!P)continue;const s=Math.max(1.5,p.sz*P.s);c.globalAlpha=Math.min(1,p.life*2);c.fillStyle=p.col;
  if(p.conf){if(p.k==null)p.k=Math.random()*6.3;const w=Math.max(0.7,s*Math.abs(Math.cos(t*7+p.k)));c.fillRect(P.x-w/2,P.y-s*0.3,w,s*0.6);}else{c.fillRect(P.x-s/2,P.y-s/2,s,s);}}c.globalAlpha=1;};

/* şut nişan konisi ve hedef artısı (yalnız şut gücü dolarken) */
function drawAim(c){const S=MG.S,b=S.ball,ce=S.hero;if(S.phase!=='play'||S.mode!=='atk'||!b||b.owner!==ce||S.charge<0||!S.gk)return;
  const p=S.charge,ax=Math.abs(IN.jx)>0.25?clamp(IN.jx,-1,1):(S.gk.x<34?0.5:-0.5),fin=!S.sprint&&p>=0.3&&p<=0.68&&Math.abs(IN.jx)>0.4;
  const tx=34+ax*(fin?3.0:3.3),tz=fin?0.35+p*1.2:0.22+p*1.85,sp=clamp(0.5+p*1.3+(S.sprint?0.6:0),0.5,2.6),over=tz>GH-0.12;
  fillPoly(c,[[b.x-0.12,b.y,0.01],[b.x+0.12,b.y,0.01],[tx+sp,0,0.01],[tx-sp,0,0.01]],over?'rgba(255,90,79,.13)':'rgba(255,194,61,.14)');
  const A=proj(tx,0,Math.min(tz,3.4));if(!A)return;const r=Math.max(6,A.s*0.3),col=over?'#ff5a4f':fin?'#7fe0ff':'#ffc23d';c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(A.x,A.y,r,0,7);
  c.moveTo(A.x-r*1.5,A.y);c.lineTo(A.x-r*0.45,A.y);c.moveTo(A.x+r*0.45,A.y);c.lineTo(A.x+r*1.5,A.y);c.moveTo(A.x,A.y-r*1.5);c.lineTo(A.x,A.y-r*0.45);c.moveTo(A.x,A.y+r*0.45);c.lineTo(A.x,A.y+r*1.5);c.stroke();}
function drawPassRing(c){const S=MG.S,b=S.ball;if(S.phase!=='play'||S.mode!=='atk'||!b||b.owner!==S.hero||typeof passPick!=='function')return;const t=passPick();if(!t)return;
  const P=proj(t.x,t.y,0);if(!P)return;const k=0.5+0.5*Math.sin(S.t*6);c.lineWidth=2;c.strokeStyle=`rgba(255,255,255,${(0.45+0.35*k).toFixed(2)})`;c.beginPath();c.ellipse(P.x,P.y,P.s*0.55,P.s*0.21,0,0,7);c.stroke();}
function drawFog(c){const fl=CAMV.s<0,h=proj(34,fl?170:-70,0);if(!h)return;const W=MG.W,H=MG.H,y=h.y;const g=c.createLinearGradient(0,y-H*0.12,0,y+H*0.2);
  g.addColorStop(0,'rgba(140,170,190,0)');g.addColorStop(0.4,'rgba(140,170,190,.1)');g.addColorStop(1,'rgba(140,170,190,0)');c.fillStyle=g;c.fillRect(0,y-H*0.12,W,H*0.32);}
function drawGoalFlash(c){const S=MG.S;if(S.phase!=='end'||!S.res||S.res.code!=='goal'||S.endT<2.2)return;const a=clamp((S.endT-2.2)/0.4,0,1)*0.42;c.fillStyle=`rgba(255,250,230,${a.toFixed(3)})`;c.fillRect(-20,-20,MG.W+40,MG.H+40);}

mgDraw=function(){const S=MG.S,c=MG.ctx,W=MG.W,H=MG.H;if(!S||!c)return;const fl=CAMV.s<0,b=S.ball;
  c.setTransform(MG.dpr,0,0,MG.dpr,0,0);if(MG.shake>0.2)c.translate(rnd(-MG.shake,MG.shake),rnd(-MG.shake,MG.shake));
  c.fillStyle=MG.sky;c.fillRect(-20,-20,W+40,H+40);
  drawStands(c);drawPitch(c);drawBoards(c);
  if(!fl){drawGoalBack(c);if(S.gates)drawGates(c);if(b.y<0)drawBall(c,b);drawPosts(c);}else{drawFarGoal(c);if(S.gates)drawGates(c);}
  for(const e of S.all)drawShadow(c,e);drawBallShadow(c,b);drawPassRing(c);drawAim(c);
  const list=S.all.map(e=>({e,k:CAMV.s*e.y}));if(fl||b.y>=0)list.push({e:b,k:CAMV.s*b.y+(b.owner||b.held?0.7:0)});list.sort((p,q)=>p.k-q.k);
  trailStep(b);
  for(const it of list){if(it.e===b){drawTrail(c);drawBall(c,b);}else{drawStreak(c,it.e);drawPlayer(c,it.e);}}
  if(fl){c.globalAlpha=0.55;drawGoalBack(c);c.globalAlpha=1;drawPosts(c);}/* v141: ters kamerada yakın pano çizilmez (kumandanın arkasında şerit gibi görünüyordu) */
  drawFog(c);drawParts(c);drawWeather(c);
  if(typeof mgDrawExtra==='function'){try{mgDrawExtra(c);}catch(e){}}
  drawOverlay(c);drawGoalFlash(c);
  c.setTransform(MG.dpr,0,0,MG.dpr,0,0);if(MG.vig)c.drawImage(MG.vig,0,0,W,H);if(MG.ts<0.85){c.globalAlpha=clamp((0.9-MG.ts)*1.4,0,0.7);c.drawImage(MG.vig,0,0,W,H);c.globalAlpha=1;}};
