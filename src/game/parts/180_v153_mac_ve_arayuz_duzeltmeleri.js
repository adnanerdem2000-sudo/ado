/* ================= v153: maç ekranı ve arayüz düzeltmeleri (telefon taşması, maç kilidi, mevki kısaltmaları, erişilebilirlik) ================= */
/* --- K2: "Sonuna simüle et"ten sonra bir sonraki maç kilitlenmesin ---
   Örtü (#abFf) maç bitince/kapanınca her zaman kalkar; çerçevedeki düğme her yeni maçta sıfırlanır. */
function abSimEndReset(){try{const W=ABM&&ABM.win;if(!W)return;const b=W.document.getElementById('ab-simend');if(!b)return;b.disabled=false;const t=b.querySelector('.mb-t');if(t)t.textContent='Sonuna simüle et';}catch(e){}}
function abFfClear(){try{const b=document.querySelector('#abFf');if(b)b.remove();}catch(e){}}
abSetup=(old=>function(S){abFfClear();abSimEndReset();return old.apply(this,arguments);})(abSetup);
abDone=(old=>function(){try{return old.apply(this,arguments);}finally{abFfClear();abSimEndReset();}})(abDone);
fxClose=(old=>function(){abFfClear();return old.apply(this,arguments);})(fxClose);
fxStart=(old=>function(){abFfClear();const r=old.apply(this,arguments);abSimEndReset();return r;})(fxStart);
/* Hızlı sonuçta çerçevenin istatistik eşlemesi durur; tam süre özetinden önce skor ve takım istatistikleri motordan alınır. */
function abSumSync(W,sim){const md=W.ABH&&W.ABH.md&&W.ABH.md();if(!md||!sim||!sim.teams)return;let pp=[50,50];try{pp=sim.possPct();}catch(e){}
  [md.hStats,md.aStats].forEach((o,e)=>{const T=sim.teams[e],st=T&&T.st;if(!o||!T)return;o.goals=T.score;if(st){o.xg=st.xg||0;o.shots=st.shots||0;o.sot=st.sot||0;o.pass=st.passes||0;o.corners=st.corners||0;o.offsides=st.offsides||0;o.fouls=st.fouls||0;}o.pos=pp[e];});}
/* --- Y1: telefonda üst çubuktan kaldırılan Arama ve Tam ekran, Menü penceresinde --- */
function v153Narrow(){return innerWidth<=600;}
ACTX.moreTabs=(old=>function(){const r=old.apply(this,arguments);try{if(v153Narrow()){const m=$('#modal .ui-menu')||$('#modal .nav-modal');if(m&&!$('#modal .ui-extra')){
  const fsOn=!document.documentElement.classList.contains('nofs');
  m.insertAdjacentHTML('afterend',`<div class="ui-extra"><button class="ui-mi btn ghost" data-act="v153Ara"><span>⌕ Oyuncu/kulüp ara</span></button>${fsOn?`<button class="ui-mi btn ghost" data-act="v153Fs"><span>⛶ Tam ekran</span></button>`:''}</div>`);}}}catch(e){}return r;})(ACTX.moreTabs);
ACTX.v153Ara=()=>{closeModal();try{ACTX.qsOpen();}catch(e){}};
ACTX.v153Fs=()=>{closeModal();try{toggleFS();}catch(e){}};
/* --- maç çerçevesi: alt sekmeler telefonda kesilmesin ("İSTATİ…") --- */
abSimEndBtn=(old=>function(){const r=old.apply(this,arguments);try{const W=ABM&&ABM.win,d=W&&W.document;if(d&&d.head&&!d.getElementById('v153-ab-css')){const s=d.createElement('style');s.id='v153-ab-css';
  s.textContent='.l2d-tabs button{flex:1 1 auto;min-width:0;padding-left:6px;padding-right:6px;letter-spacing:.02em;white-space:nowrap}@media (max-width:440px){.l2d-tabs button{font-size:12px;letter-spacing:0}}';d.head.appendChild(s);}}catch(e){}return r;})(abSimEndBtn);
/* --- mevki kısaltmaları: her yerde oyunun 14 mevkili Türkçe kümesi (DPT: KL, SLB, STP, SĞB, SLKB, SĞKB, DOS, MOS, SLO, SĞO, SLK, OOS, SĞK, SNT) ---
   DF/OS/KN/FW kaba grupları yalnız iç mantıkta kalır; ekranda oyuncunun asıl mevkisi ya da maçta oynadığı yerin kısaltması görünür. */
function slotTag(s){if(!s)return '';const k=slotKind(s),L=s[1]<.5;return {GK:'KL',CB:'STP',FB:s[2]>=.28?(L?'SLKB':'SĞKB'):(L?'SLB':'SĞB'),DM:'DOS',CM:'MOS',AM:'OOS',WM:L?'SLO':'SĞO',W:L?'SLK':'SĞK',ST:'SNT'}[k]||'';}
function posTag(p,T){try{if(p&&T&&p.slot!=null&&!p.off&&!p.subbed){const S=FMF[T.form];if(S&&S[p.slot]){const t=slotTag(S[p.slot]);if(t)return t;}}}catch(e){}return dpTag(p);}
const POS_GRP_TR={KL:'Kaleci',DF:'Defans',OS:'Orta saha',KN:'Kanat',FW:'Forvet'};
function v153PosK(x){try{const p=x&&x.k?pByKey(x.k):null;if(p)return dpTag(p);}catch(e){}return x&&x.pos||'';}
/* futbolcunun kendi mevkisi: sihirbazda seçilen rol (G.p.rol, 14 mevkili kod) */
function meTag(p){p=p||(G&&G.p);if(!p)return '';if(p.pos==='KL')return 'KL';if(p.rol&&DPT[p.rol])return DPT[p.rol];return ({DF:'STP',OS:'MOS',KN:'KN',FW:'SNT'})[p.pos]||p.pos||'';}
try{for(const r of MV_POS)if(DPT[r[0]])r[1]=DPT[r[0]];}catch(e){}   /* sihirbaz saha şeması: MO→MOS, SF→SNT */
function v153PosP(p){try{if(!p)return '';if(p.k)return dpTag(p);}catch(e){}return p&&p.pos||'';}
/* --- seçme günü: tek sütun, sonuç → rapor → teklifler; seçme öncesinde düğme açıklamanın altında --- */
render=(old=>function(){const r=old.apply(this,arguments);try{const on=!!(G&&G.phase==='tryout');document.documentElement.classList.toggle('v153-try',on);
  if(on){const v=$('#view');if(v){const sh=[...v.querySelectorAll('p.sub-h')].find(p=>/Gelen teklifler/.test(p.textContent)),offers=[...v.querySelectorAll('.offer')];
    if(sh&&offers.length){let a=sh;for(const o of offers){a.insertAdjacentElement('afterend',o);a=o;}}
    const cta=v.querySelector('[data-act="tryStart"]'),td=v.querySelector('section.today');if(cta&&td&&!(td.compareDocumentPosition(cta)&Node.DOCUMENT_POSITION_FOLLOWING))td.insertAdjacentElement('afterend',cta);
    for(const h of v.querySelectorAll(':scope>.hub-top'))if(!h.children.length&&!h.textContent.trim())h.remove();}}}catch(e){}return r;})(render);
/* --- öğretici ve Kontroller: iç düğme harfleri (A/B/C/D) yerine yalnız gerçek tuş ve eylem adı --- */
function v153ActLbl(k,g){try{const L=ctlLblFor(g)[k];return L?String(L[0]).toLocaleLowerCase('tr-TR'):'';}catch(e){return '';}}
function v153TutFix(){const p=document.querySelector('#mgTut .tut-card p:last-of-type')||document.querySelector('#mgTut .tut-card p');if(!p)return;const t0=p.textContent;if(!/Klavyede/.test(t0))return;
  const g=G&&G.p&&G.p.pos==='KL'?'gk':'atk';let t=t0;
  for(const k of ['a','b','c','d']){const U=k.toUpperCase(),lb=v153ActLbl(k,g);let key='';try{key=ctlLbl(ctlKeys()[k][0]);}catch(e){}if(!key)continue;
    const ek=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp(`(,\\s*)?${ek} ${U}(\\s*\\([^)]*\\))?(?=[,.\\s]|$)`);
    t=t.replace(re,(m,c)=>lb?`${c||''}${key} ${lb}`:'');}
  t=t.replace(/^(Klavyede:[^,]*?), ,/,'$1,').replace(/,\s*,/g,',').replace(/,\s*\./g,'.');if(t!==t0)p.textContent=t;}
try{const tt=document.getElementById('mgTut');if(tt&&window.MutationObserver)new MutationObserver(()=>{try{v153TutFix();}catch(e){}}).observe(tt,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});}catch(e){}
ctlSideHTML=(old=>function(){let h=old.apply(this,arguments);try{if(CTLU.sel!=='joy'){const lb=ctlLblFor(CTLU.g)[CTLU.sel];let key='';try{key=ctlBtnKey(CTLU.sel);}catch(e){}
  const nm=lb?lb[0]:'bu durumda boş';h=h.replace(/<p class="ctl-selname">[\s\S]*?<\/p>/,`<p class="ctl-selname">Seçili: <b>${esc(nm)}</b>${key?` <small class="muted">· klavye: ${esc(key)}</small>`:''}</p>`);}}catch(e){}return h;})(ctlSideHTML);
/* Klavye tuşları listesinde "A düğmesi" yerine eylem adları (topla / rakipte / kalecide) */
function v153CtlNames(){try{const f=s=>s.charAt(0)+s.slice(1).toLocaleLowerCase('tr-TR');
  for(const r of CTL_ACTS){if(!/^[abcd]$/.test(r[0]))continue;const n=CTL_CTX.map(g=>{const L=ctlLblFor(g)[r[0]];return L?f(L[0]):null;}).filter(Boolean);const u=[...new Set(n)];if(u.length){r[1]=u.join(' / ')+' düğmesi';CTL_AN[r[0]]=r[1];}}}catch(e){}}
openControls=(old=>function(){v153CtlNames();return old.apply(this,arguments);})(openControls);
