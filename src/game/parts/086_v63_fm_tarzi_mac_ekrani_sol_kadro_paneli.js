/* ================= v63: FM tarzı maç ekranı — sol kadro paneli, duraklatınca açılan taktik ekranı (diziliş, roller, tüm talimatlar, oyuncu değişikliği, yer değiştirme) ================= */
const fxCanTac=()=>{const S=FX;return !!(S&&G&&G.mode==='mgr'&&!S.watch);};
function fxCondRing(st,r){const c=st>=75?'#35d49a':st>=58?'#ffd166':'#ff6b6b',deg=Math.round(st*3.6);return `<i class="fxr" style="--deg:${deg}deg;--c:${c}"></i>`;}
function fxRtCls(v){return v>=7.5?'g':v>=6.8?'b':v>=6.2?'n':'r';}
/* sol panel: kadro, kondisyon, reyting, olaylar */
function fxLeftHTML(){const S=FX;if(!S)return '';const U=S.U,on=fxOn(U).sort((a,b)=>a.slot-b.slot),sub=U.P.filter(p=>p.subbed);
  const ev=p=>`${'⚽'.repeat(p.s.g||0)}${p.s.as?'🅰'.repeat(p.s.as):''}${p.yel?'🟨':''}${p.off&&!p.subbed?'🟥':''}`;
  const row=(p,cls)=>`<div class="fxl-r ${cls||''}"><span class="fxl-n">${p.num}</span><span class="fxl-p">${esc(p.spos)}</span><b>${esc(p.sur)}</b><em>${ev(p)}</em><span class="fxl-c">${fxCondRing(p.st)}</span><span class="fxl-rt ${fxRtCls(fxR(p))}">${dec(fxR(p),1)}</span></div>`;
  return `<div class="fxl-h">${crestSVG(CLUBS[U.id]||U,20)}<b>${esc(U.short)}</b><small>${esc(U.form)} · ${TAC[U.tacK]?TAC[U.tacK].n:''}</small></div>
   ${fxCanTac()?`<button class="fxl-tac" data-fx="tacp">⏸ TAKTİK EKRANI</button>`:''}
   <div class="fxl-l">${on.map(p=>row(p)).join('')}</div>${sub.length?`<p class="fxl-s">Oyundan çıkanlar</p><div class="fxl-l">${sub.map(p=>row(p,'out')).join('')}</div>`:''}
   <p class="fxl-s">Yedekler · ${5-U.subs} değişiklik hakkı</p><div class="fxl-l">${U.bench.slice(0,9).map(b=>`<div class="fxl-r bn"><span class="fxl-n">${b.num||''}</span><span class="fxl-p">${esc(dpTag(b))}</span><b>${esc(ksur(b.name))}</b><em></em><span class="fxl-c"></span><span class="fxl-rt">${R200(b.ovr)}</span></div>`).join('')}</div>`;}
fxOpen=(old=>function(){const r=old.apply(this,arguments);try{const el=$('#fx');if(el&&!$('#fxLt')){el.insertAdjacentHTML('beforeend',`<aside class="fx-lt" id="fxLt"></aside>`);}
    const ctl=document.querySelector('#fx .fx-ctl');if(ctl&&fxCanTac()&&!ctl.querySelector('[data-fx=tacp]'))ctl.insertAdjacentHTML('afterbegin',`<button data-fx="tacp" class="fx-tacb" title="Oyunu durdur ve taktik ekranını aç (T)">⏸ Taktik</button>`);
    const lt=$('#fxLt');if(lt)lt.innerHTML=fxLeftHTML();}catch(e){console.warn(e);}return r;})(fxOpen);
fxTopUI=(old=>function(){const r=old.apply(this,arguments);try{const S=FX,lt=$('#fxLt');if(S&&lt&&window.innerWidth>=1300){S._ltT=(S._ltT||0)+1;if(S._ltT%2===0||S.phase!=='play')lt.innerHTML=fxLeftHTML();}}catch(e){}return r;})(fxTopUI);
/* ---------- maç içi taktik ekranı ---------- */
let FXT={tab:'ti',sel:null,swap:null};
function fxTacOpen(){const S=FX;if(!fxCanTac())return;if(S.phase==='play'){S._tacResume=true;S.phase='pause';}else S._tacResume=S.phase==='pause'||S.phase==='pre';S.ff=false;FXT.sel=null;FXT.swap=null;fxTacRender();fxUI();}
function fxTacClose(resume){const el=$('#fxTac');if(el)el.remove();const S=FX;if(!S)return;if(resume&&(S.phase==='pause'||S.phase==='pre'))S.phase='play';fxUI();}
function fxSlotXY(T,p){const SL=FMF[T.form];const s=SL&&SL[p.slot];if(!s)return [50,50];return [s[1]*100,s[0]==='KL'?92:clamp((1-s[2])*84+4,5,90)];}
function fxTacHTML(){const S=FX,U=S.U,on=fxOn(U),sel=on.find(p=>p.k===FXT.sel);
  const pitch=`<div class="fxt-pitch">${on.map(p=>{const [x,y]=fxSlotXY(U,p);const R=(FMR[p.kind]||[]).find(r=>r[0]===p.role);return `<button class="fxt-p ${FXT.sel===p.k?'on':''} ${p.yel?'yc':''}" data-fx="tsel" data-k="${p.k}" style="left:${x}%;top:${y}%"><span class="fxt-sh" style="background:${U.c1};color:${U.c2}">${p.num}${fxCondRing(p.st)}</span><b>${esc(p.sur)}</b><small>${R?R[2]:''}${p.spos!=='KL'?'·'+(DUTY[p.duty]||DUTY.des)[0][0]:''} · <i class="${fxRtCls(fxR(p))}">${dec(fxR(p),1)}</i></small></button>`;}).join('')}</div>`;
  const forms=`<div class="fxt-forms">${Object.keys(FMF).map(f=>`<button class="chip" data-fx="tform" data-k="${f}" aria-pressed="${U.form===f}">${f}</button>`).join('')}</div>`;
  let selBox='';if(sel){const roles=FMR[sel.kind]||[];selBox=`<div class="fxt-sel"><p><b>${sel.num} ${esc(sel.name)}</b> · ${esc(KIND_N[sel.kind]||sel.spos)} · kondisyon %${Math.round(sel.st)} · reyting ${dec(fxR(sel),1)}</p>
     <div class="seg2">${roles.map(r=>`<button class="chip" data-fx="trole" data-k="${r[0]}" aria-pressed="${sel.role===r[0]}">${r[1]}</button>`).join('')}</div>
     ${sel.spos!=='KL'?`<div class="seg2">${Object.entries(DUTY).map(([k,v])=>`<button class="chip" data-fx="tduty" data-k="${k}" aria-pressed="${(sel.duty||'des')===k}">${v[0]}</button>`).join('')}</div>`:''}
     <p class="fxt-hint">${FXT.swap?'Yer değiştireceği oyuncuya dokun.':'Yedeklerden birine dokunursan oyuncu değişikliği yapılır. Sahadaki başka bir oyuncuya dokunursan yer değiştirirler.'}</p></div>`;}
  const tiG=[['pos','Topa sahipken'],['tr','Geçişlerde'],['def','Topa sahip değilken']];
  const ti=`<p class="fx-sub">Yaklaşım</p><div class="seg2">${Object.entries(TAC).map(([k,v])=>`<button class="chip" data-fx="ttac" data-k="${k}" aria-pressed="${U.tacK===k}">${v.n}</button>`).join('')}</div>
    ${tiG.map(([g,n])=>`<p class="fx-sub">${n}</p>${TI.filter(t=>t.g===g).map(t=>`<div class="ti-row"><span>${t.n}</span><div class="seg2">${t.o.map(o=>`<button class="chip" data-fx="tti" data-k="${t.k}" data-v="${o[0]}" aria-pressed="${(U.ti[t.k]||t.d)===o[0]}">${o[1]}</button>`).join('')}</div></div>`).join('')}`).join('')}`;
  const bench=`<p class="fx-sub">Yedekler · ${5-U.subs}/5 değişiklik hakkı ${sel?`· <b>${esc(sel.sur)}</b> yerine girecek oyuncuyu seç`:'· önce sahadan çıkacak oyuncuya dokun'}</p><div class="fxt-bench">${U.bench.map(b=>{const fit=sel?(b.pos===sel.pos?'fit':''):'';return `<button class="fxt-b ${fit}" data-fx="tsub" data-k="${b.k}" ${!sel||U.subs>=5?'disabled':''}><span>${esc(dpTag(b))}</span><b>${esc(b.name)}</b><em>${R200(b.ovr)}</em></button>`;}).join('')||'<p class="muted">Yedek kalmadı.</p>'}</div>`;
  const sh=`<p class="fx-sub">Kenardan seslen</p><div class="fx-sh">${Object.entries(FX_SHOUT).map(([k,v])=>`<button data-fx="tshout" data-k="${k}" class="${U.sh&&U.sh.k===k&&U.sh.until>S.t?'on':''}"><b>${v[0]}</b><small>${v[1]}</small></button>`).join('')}</div>`;
  const a=S.stats[0],b=S.stats[1],tp=a.pos+b.pos||1;const st=`<div class="fxt-st"><div><b>${S.score[0]}-${S.score[1]}</b><span>${fxMin()}’</span></div><div><b>%${Math.round(a.pos/tp*100)}</b><span>topa sahip olma</span></div><div><b>${a.sh}-${b.sh}</b><span>şut</span></div><div><b>${dec(a.xg,2)}-${dec(b.xg,2)}</b><span>xG</span></div></div>`;
  const tabs=[['ti','Talimatlar'],['sub','Değişiklik'],['sh','Seslen']];
  return `<div class="fxt-card"><header class="fxt-hd"><div><b>Taktik ekranı</b><small>Oyun durduruldu · ${esc(S.U.short)} ${S.score[0]}-${S.score[1]} ${esc(S.O.short)} · ${fxMin()}’</small></div><button class="cta sm" data-fx="tgo">▶ Devam et</button><button class="btn sm ghost" data-fx="tclose">Kapat</button></header>
    <div class="fxt-body"><section class="fxt-l">${st}${forms}${pitch}${selBox}</section><section class="fxt-r"><div class="fxt-tabs">${tabs.map(([k,l])=>`<button data-fx="ttab" data-k="${k}" class="${FXT.tab===k?'on':''}">${l}</button>`).join('')}</div><div class="fxt-pane">${FXT.tab==='ti'?ti:FXT.tab==='sub'?bench:sh}</div></section></div></div>`;}
function fxTacRender(){const S=FX;if(!S)return;let el=$('#fxTac');if(!el){el=document.createElement('div');el.id='fxTac';el.className='fxt';$('#fx').appendChild(el);}const sc=el.querySelector('.fxt-pane');const top=sc?sc.scrollTop:0;el.innerHTML=fxTacHTML();const sc2=el.querySelector('.fxt-pane');if(sc2)sc2.scrollTop=top;}
function fxSwap(a,b){const keys=['slot','spos','kind','l','d','role','duty'];const t={};for(const k of keys){t[k]=a[k];a[k]=b[k];b[k]=t[k];}fxEv(fxMin(),`${a.sur} ile ${b.sur} yer değiştirdi.`,'tac');}
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return old.apply(this,arguments);
  if(a==='tacp'){if($('#fxTac'))fxTacClose(true);else fxTacOpen();return;}
  const MY=['tgo','tclose','ttab','tform','tsel','trole','tduty','ttac','tti','tshout','tsub'];if(!$('#fxTac')||!MY.includes(a))return old.apply(this,arguments);
  const U=S.U;
  if(a==='tgo'){fxTacClose(true);return;}if(a==='tclose'){fxTacClose(S._tacResume);return;}
  if(a==='ttab'){FXT.tab=k;fxTacRender();return;}
  if(a==='tform'){fxFormation(k);FXT.sel=null;fxTacRender();return;}
  if(a==='tsel'){const p=fxOn(U).find(x=>x.k===k);if(!p)return;if(FXT.sel&&FXT.sel!==k){const q=fxOn(U).find(x=>x.k===FXT.sel);if(q&&q.spos!=='KL'&&p.spos!=='KL'){fxSwap(q,p);FXT.sel=null;fxTacRender();return;}}FXT.sel=FXT.sel===k?null:k;FXT.tab=FXT.sel?'sub':FXT.tab;fxTacRender();return;}
  if(a==='trole'||a==='tduty'){const p=fxOn(U).find(x=>x.k===FXT.sel);if(p){if(a==='trole')p.role=k;else p.duty=k;fxEv(fxMin(),`${p.sur}: ${a==='trole'?'rol':'görev'} değişti.`,'tac');}fxTacRender();return;}
  if(a==='ttac'){fxSetTi({},k);fxTacRender();return;}
  if(a==='tti'){fxSetTi({[k]:v});fxTacRender();return;}
  if(a==='tshout'){fxShout(k);fxTacRender();return;}
  if(a==='tsub'){if(U.subs>=5)return toast('Değişiklik hakkın kalmadı');const out=fxOn(U).find(x=>x.k===FXT.sel),inP=U.bench.find(b=>b.k===k);if(out&&inP&&fxSub(U,out,inP)){FXT.sel=null;toast(`${inP.name} oyuna girdi`);}fxTacRender();return;}
  return old.apply(this,arguments);})(fxAct);
/* T tuşu */
window.addEventListener('keydown',e=>{if(!FX||!$('#fx')||$('#fx').hidden)return;if(/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;if(e.key==='t'||e.key==='T'){e.preventDefault();fxAct('tacp');}});
/* devre arası: taktik ekranı kısayolu */
fxHTHTML=(old=>function(){const h=old.apply(this,arguments);if(!fxCanTac())return h;return h.replace('<h3>',`<button class="btn sm fxt-ht" data-fx="tacp">⚙ Taktik ekranını aç</button><h3>`);})(fxHTHTML);
/* maç kapanınca paneli temizle */
fxClose=(old=>function(){const el=$('#fxTac');if(el)el.remove();return old.apply(this,arguments);})(fxClose);

