/* ================= v102: hakemde "yalnız ciddi kararlar" seçeneği · yardımcılara danışma · Pro modunda FIFA tarzı yapay zekâ geri bildirimi ================= */
/* ---------- A) hakem: karar kapsamı ---------- */
function refSerious(){try{return localStorage.getItem('refSer')!=='0';}catch(e){return true;}}
ACTX.refSer=el=>{const on=!refSerious();try{localStorage.setItem('refSer',on?'1':'0');}catch(e){}toast(on?'Yalnız ciddi kararlar sana sorulacak (penaltı, kırmızı, gol, net gol şansı).':'Bütün kararlar sana sorulacak: her faul, taç, korner, kale vuruşu ve ofsayt.');try{render();}catch(e){}try{refBarSync();}catch(e){}};
abrWant=(old=>function(inf){if(!refSerious())return !ABM.ff&&refLiveOn();return old.apply(this,arguments);})(abrWant);
abrWantGoal=(old=>function(gi){if(!refSerious())return !ABM.ff&&refLiveOn();return old.apply(this,arguments);})(abrWantGoal);
abrSetupSim=(old=>function(sim){old.apply(this,arguments);sim.refAllFn=refSerious()?null:(inf=>!ABM.ff&&refLiveOn());})(abrSetupSim);
/* hub ve maç çubuğunda seçenek */
refHub=(old=>function(){let h=old.apply(this,arguments);try{const on=refSerious();h=h.replace(/(<button[^>]*data-act="ref3"[\s\S]*?<\/button>)/,`$1<button class="btn sm ref-ser${on?' on':''}" data-act="refSer" aria-pressed="${on}">${on?'☑':'☐'} Yalnızca ciddi kararları bana bırak</button>`);}catch(e){}return h;})(refHub);
viewHub=(old=>function(){let h=old.apply(this,arguments);try{if(isRef()&&h.indexOf('data-act="refSer"')<0&&h.indexOf('data-act="ref3"')>=0){const on=refSerious();h=h.replace(/(<button[^>]*data-act="ref3"[\s\S]*?<\/button>)/,`$1<button class="btn sm ref-ser${on?' on':''}" data-act="refSer" aria-pressed="${on}">${on?'☑':'☐'} Yalnızca ciddi kararları bana bırak</button>`);}}catch(e){}return h;})(viewHub);
function refBarSync(){const W=ABM.win;if(!W)return;const d=W.document;let b=d.getElementById('abh-rser');if(!b){const ref=d.getElementById('abh-rcard');if(!ref)return;b=d.createElement('button');b.type='button';b.id='abh-rser';b.className=ref.className;ref.parentNode.insertBefore(b,ref.nextSibling);b.addEventListener('click',()=>{ACTX.refSer();});}
  const on=refSerious();b.hidden=!refLiveOn();const t=on?'Ciddi kararlar':'Tüm kararlar';if(b.dataset.t!==t){b.dataset.t=t;b.innerHTML=`<span aria-hidden="true" style="font-size:15px">⚖</span><span class="mb-t">${t}</span>`;b.title=on?'Yalnız ciddi kararlar sorulur. Tıkla: her karar sorulsun':'Her karar sorulur (taç, korner, ofsayt dahil). Tıkla: yalnız ciddi kararlar';}}
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{if(refLiveOn())refBarSync();}catch(e){}return r;})(abTickCore);
/* ---------- yeni karar türleri: taç / kale çizgisi / ofsayt ---------- */
function abrTeamShort(e){const S=ABM.fx,T=S&&S.T[abrSide(e)];return T?T.short:(e?'Deplasman':'Ev sahibi');}
const _abrQ=abrQ;abrQ=function(A){if(A.kind==='out')return A.sub==='throw'?'Top taca çıktı':'Top kale çizgisinden çıktı';
  if(A.kind==='offs'){const p=abrP(A.p);return `Ofsayt şüphesi: <b>${esc(p.name)}</b> <i>(${esc(p.tm)})</i>`;}return _abrQ(A);};
const _abrWhere=abrWhere;abrWhere=function(A){return A.kind==='out'?(A.sub==='throw'?'Taç çizgisi':'Kale çizgisi'):A.kind==='offs'?'Ofsayt':_abrWhere(A);};
abrCalls=(old=>function(A){if(A.kind==='out')return A.sub==='throw'?[['T0',`${abrTeamShort(0)} taç`],['T1',`${abrTeamShort(1)} taç`]]:[['corner','Korner'],['goalkick','Kale vuruşu']];
  if(A.kind==='offs')return [['ofs','Ofsayt (endirekt serbest vuruş)'],['devam','Ofsayt yok, devam']];return old.apply(this,arguments);})(abrCalls);
abrDecTxt=(old=>function(A,D){if(A.kind==='out')return D.call==='corner'?'korner':D.call==='goalkick'?'kale vuruşu':`${abrTeamShort(D.call==='T1'?1:0)} lehine taç`;if(A.kind==='offs')return D.call==='ofs'?'ofsayt':'ofsayt yok';return old.apply(this,arguments);})(abrDecTxt);
abrCues=(old=>function(A){if(A.kind==='out'){const L=[],l=A.last>=0?abrP(A.last):null,sees=Math.random()<.8;
    if(l){const shown=sees?l:null;L.push(shown?`Topa son dokunan ${shown.name} (${shown.tm}) gibi görünüyor`:'Topa son kimin dokunduğu net görünmüyor; iki oyuncu birlikte gitti');}
    if(A.sub==='line')L.push(sees?(A.truth.call==='corner'?'Top savunma oyuncusundan sekerek çıktı':'Hücum oyuncusunun vuruşu/pası dışarı gitti'):'Kale önünde kalabalık, son temas belirsiz');return L;}
  if(A.kind==='offs'){const mo=A.mo,L=[];if(mo==null)L.push('Pas anını tam göremedin');else{const a=Math.abs(mo);L.push(a<.25?'Pas anında son savunmacıyla neredeyse aynı hizada':a<.6?(Math.random()<.75?(mo>0?'Pas anında bir adım önde gibi':'Pas anında hizada ya da gerisinde gibi'):'Açı yanıltıcı, hizayı kestirmek zor'):(mo>0?'Pas anında son savunmacının açık ara önünde':'Pas anında son savunmacının gerisinde'));}
    L.push(A.flag?'Yan hakem bayrağını kaldırdı':'Yan hakem bayrağını kaldırmadı');return L;}
  return old.apply(this,arguments);})(abrCues);
abrStory=(old=>function(A){if(A.kind==='out'){const l=A.last>=0?abrP(A.last):null;return A.sub==='throw'?`Top taç çizgisini geçti${l?`; ${l.name} ve rakibi topa birlikte gitti`:''}. Taç kimin?`:`Top kale çizgisini geçti${l?`, son mücadelede ${l.name} vardı`:''}. Korner mi, kale vuruşu mu?`;}
  if(A.kind==='offs'){const p=abrP(A.p);return `Derin pas ${p.name} (${p.tm}) için. Pas anında son savunmacının önünde miydi? Savunma oyuncuları kollarını kaldırmış ofsayt istiyor.`;}return old.apply(this,arguments);})(abrStory);
abrTruthExplain=(old=>function(A){if(A.kind==='out'){const c=A.truth.call;return c==='corner'?'korner: topa son savunma oyuncusu dokundu':c==='goalkick'?'kale vuruşu: topa son hücum oyuncusu dokundu':`${abrTeamShort(c==='T1'?1:0)} lehine taç: topa son rakip oyuncu dokundu`;}
  if(A.kind==='offs')return A.truth.call==='ofs'?'ofsayt: pas anında son savunmacının önündeydi':'ofsayt yok: pas anında hizada ya da gerisindeydi';return old.apply(this,arguments);})(abrTruthExplain);
abrJudge=(old=>function(A,D){if(A.kind==='out')return {lvl:D.call===A.truth.call?'ok':'minor',small:1};if(A.kind==='offs')return {lvl:D.call===A.truth.call?'ok':'mid'};return old.apply(this,arguments);})(abrJudge);
/* taç ve kale çizgisi kararları hızlıdır: tekrar giriş yok, rapora yalnız hatalar yazılır */
abrOpen=(old=>function(A){if(A.kind!=='out'&&A.kind!=='offs')return old.apply(this,arguments);
  ABR.ask=A;ABR.open=1;ABR.stage='dec';ABR.min=abMin();ABR.minz=0;ABR.sel={call:null};ABR.cues=abrCues(A);ABR.voices=abrVoices(A);ABR.warn=[];ABR.first=null;ABR.story=abrStory(A);ABR.asked={};abrRender();})(abrOpen);
abrFinish=(old=>function(A,D,J,viaVar){if(A.kind!=='out')return old.apply(this,arguments);const R=REF,ok=J.lvl==='ok',mn=ABR.min;
  R.outN=(R.outN||0)+1;if(ok){R.outOk=(R.outOk||0)+1;R.rt+=.02;}else{R.rt-=.12;R.log.push([mn,'out','hatalı']);}
  try{ABM.sim.refApply({call:D.call});}catch(e){try{ABM.sim.refHold=false;ABM.sim.refAsk=null;}catch(_){}}
  abToast(`${ok?'✔':'✖'} ${ok?'Doğru':'Doğrusu'}: ${abrTruthExplain(A)}.`);ABR.ask=null;ABR.open=0;ABR.stage=null;const r=abrRoot();if(r)r.innerHTML='';})(abrFinish);
REF_TN.out='Taç / korner / kale vuruşu';REF_TN.offs='Ofsayt';
abrType=(old=>function(A){if(A.kind==='offs')return 'offs';if(A.kind==='out')return 'out';return old.apply(this,arguments);})(abrType);
/* maç sonu raporuna çizgi kararlarının özeti */
refFinish=(old=>function(){const R=REF;try{if(R&&R.outN)R.log.push([90,'out',`${R.outOk||0}/${R.outN} doğru`]);}catch(e){}return old.apply(this,arguments);})(refFinish);
/* ---------- B) yardımcılara danış: her pozisyonda sorulabilir, %100 doğru değiller ---------- */
function abrAnsTxt(A,t){if(A.kind==='out'){return t==='corner'?'son dokunan savunmacı, bence korner':t==='goalkick'?'son dokunan hücumcu, kale vuruşu':`${abrTeamShort(t==='T1'?1:0)} taçı, son dokunan rakip`;}
  if(A.kind==='offs')return t==='ofs'?'bence ofsayt, pas anında öndeydi':'ofsayt yok, aynı hizadaydı';return abrTruthTxt(A,t);}
function abrTruthOf(A){return A.kind==='foul'?A.truth:A.truth.call;}
function abrWrong(A){if(A.kind==='out'){const c=A.truth.call;return A.sub==='throw'?(c==='T0'?'T1':'T0'):(c==='corner'?'goalkick':'corner');}if(A.kind==='offs')return A.truth.call==='ofs'?'devam':'ofs';return abrWrongOf(A);}
const ABR_WHO={ar:['yardımcı hakem',0],four:['dördüncü hakem',1],var:['VAR',2]};
function abrAccuracy(A,who){const base=who==='var'?.9:who==='four'?.63:A.kind==='out'?.84:A.kind==='offs'?.78:A.kind==='goal'?.76:.72;const hard=A.kind==='foul'?(A.sev>=.72||A.clean?-.0:(A.sev>=.42&&A.sev<.55?-.08:0)):A.kind==='offs'&&A.mo!=null&&Math.abs(A.mo)<.25?-.12:0;return clamp(base+hard,.4,.95);}
function abrAsk(who){const A=ABR.ask;if(!A||(ABR.asked||{})[who])return;ABR.asked=ABR.asked||{};ABR.asked[who]=1;const nm=who==='var'?'VAR odası':abrVoiceNames()[ABR_WHO[who][1]]||ABR_WHO[who][0];
  const ok=Math.random()<abrAccuracy(A,who),t=ok?abrTruthOf(A):abrWrong(A),hedge=Math.random()<.25&&who!=='var'?['Emin değilim ama ','Açım iyi değildi, ','Bana kalırsa '][Math.floor(Math.random()*3)]:'';
  ABR.voices.push({nm,rol:ABR_WHO[who][0],txt:`${hedge?hedge+'h':'H'}ocam, ${abrAnsTxt(A,t)}.`});abrRender();}
/* kendiliğinden konuşma seyrek: çoğu zaman sen sorarsın */
abrVoices=(old=>function(A){const out=[];if(Math.random()<(A.kind==='foul'&&(A.truth.card==='R'||A.truth.card==='R2')?.55:.3)){const [a1]=abrVoiceNames();const ok=Math.random()<abrAccuracy(A,'ar');out.push({nm:a1,rol:'yardımcı hakem',txt:'Hocam, '+abrAnsTxt(A,ok?abrTruthOf(A):abrWrong(A))+'.'});}return out;})(abrVoices);
abrRender=(old=>function(){old.apply(this,arguments);try{const r=abrRoot(),A=ABR.ask;if(!r||!A||(ABR.stage!=='dec'))return;const f=r.querySelector('.abr-f');if(!f||r.querySelector('.abr-ask'))return;const as=ABR.asked||{};
  const canVar=hasVAR(REF.F)&&(A.kind==='foul'||A.kind==='goal')&&(A.pen||A.kind==='goal'||A.truth.card==='R'||A.dogso>=.3);
  const btn=(k,l)=>`<button type="button" data-r="ask:${k}" ${as[k]?'disabled':''}>${l}</button>`;
  f.insertAdjacentHTML('beforebegin',`<div class="abr-l">Danış</div><div class="abr-o abr-ask">${btn('ar','🎧 Yardımcı hakeme sor')}${btn('four','🎧 4. hakeme sor')}${canVar?btn('var','📺 VAR’a sor'):''}</div>`);}catch(e){}})(abrRender);
abrClick=(old=>function(ev){const b=ev.target.closest('[data-r]');if(b&&/^ask:/.test(b.dataset.r)){abrAsk(b.dataset.r.slice(4));return;}return old.apply(this,arguments);})(abrClick);
/* ---------- C) Pro modu: FIFA tarzı geri bildirim, pas önerisi, pozisyon önerisi ---------- */
const PRFB={last:-1,lastPassT:-9,shotMine:0,popT:{},callT:-99};
function proPopCSS(d){if(d.getElementById('pro-pop-style'))return;const st=d.createElement('style');st.id='pro-pop-style';st.textContent=`#abh-pops{position:fixed;right:12px;top:64px;z-index:2147482500;display:flex;flex-direction:column;align-items:flex-end;gap:5px;pointer-events:none}
#abh-pops div{font:800 14px 'Barlow Condensed',Inter,sans-serif;letter-spacing:.03em;padding:5px 10px;border-radius:8px;background:rgba(10,16,30,.82);color:#fff;border-left:3px solid #8494af;animation:abpop 2.6s ease forwards}
#abh-pops div.p{border-left-color:#35d49a}#abh-pops div.p b{color:#35d49a}#abh-pops div.n{border-left-color:#ef3b36}#abh-pops div.n b{color:#ff7b7b}#abh-pops div.c{border-left-color:#ffc93c;color:#ffc93c}
@keyframes abpop{0%{opacity:0;transform:translateX(16px)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
@media (max-width:600px){#abh-pops{top:auto;bottom:calc(150px + env(safe-area-inset-bottom));right:8px}#abh-pops div{font-size:12.5px}}`;d.head.appendChild(st);}
function proPop(txt,cls,key,gap){const W=ABM.win;if(!W)return;const now=performance.now();if(key&&now-(PRFB.popT[key]||0)<(gap||1800))return;if(key)PRFB.popT[key]=now;const d=W.document;proPopCSS(d);let box=d.getElementById('abh-pops');if(!box){box=d.createElement('div');box.id='abh-pops';d.body.appendChild(box);}
  const el=d.createElement('div');el.className=cls||'';el.innerHTML=txt;box.appendChild(el);while(box.children.length>4)box.firstChild.remove();setTimeout(()=>{try{el.remove();}catch(e){}},2700);}
const pp=(v,t)=>`<b>${v>0?'+':'−'}${dec(Math.abs(v),1)}</b> ${t}`;
abEv=(old=>function(e){const r=old.apply(this,arguments);try{if(!(PRO.on&&FX&&FX.pl3&&ABM.sim))return r;const me=pl3Me(),mi=me&&me.ei!=null?me.ei:-2,t=e.type,sim=ABM.sim;
    if(t==='PASS'&&e.p===mi){PRFB.lastPassT=sim.t;}
    else if(t==='PASS_OK'&&e.p2===mi){const prog=e.meta&&e.meta.prog;proPop(pp(.1,prog>12?'İleri pas':'İsabetli pas'),'p','pass',1500);}
    else if(t==='SHOT'){PRFB.shotMine=e.p===mi?1:0;}
    else if(PRFB.shotMine&&(t==='SAVE'||t==='OFF'||t==='BLOCK'||t==='POST')){PRFB.shotMine=0;proPop(t==='SAVE'?pp(.2,'İsabetli şut'):t==='POST'?pp(.1,'Direk!'):t==='BLOCK'?pp(-.1,'Şut bloklandı'):pp(-.1,'İsabetsiz şut'),t==='SAVE'||t==='POST'?'p':'n');}
    else if(t==='GOAL'){if(e.p===mi&&!(e.meta&&e.meta.own))proPop(pp(1,'GOL'),'p');else if(e.meta&&e.meta.assist===mi)proPop(pp(.6,'ASİST'),'p');PRFB.shotMine=0;}
    else if((t==='TACKLE'||t==='INTERCEPT')&&e.p===mi)proPop(pp(.3,t==='TACKLE'?'Top çaldın':'Pas arası'),'p');
    else if(t==='FOUL'){if(e.p===mi)proPop(pp(-.2,'Faul yaptın'),'n');else if(e.p2===mi)proPop(pp(.1,'Faul kazandın'),'p');}
    else if(t==='OFFSIDE'&&e.p===mi)proPop(pp(-.1,'Ofsayt'),'n');
  }catch(x){}return r;})(abEv);
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const W=ABM.win,sim=ABM.sim;if(!(PRO.on&&W&&sim&&FX&&FX.pl3))return r;const c=sim.ctl,me=pl3Me(),mi=me&&me.ei!=null?me.ei:-2,q=sim.players[mi],B=sim.ball;
    if(!c||!q||q.off||MR.out){W.__abSpot=null;return r;}
    const own=B.owner===q;W.__abRing=[{id:mi,col:'#3fe0ff'}].concat(own&&c.sug>=0?[{id:c.sug,col:'#ffc93c'}]:[]);
    /* yapay zekânın önerdiği yer: uzaktaysan saha üstünde soluk halka */
    W.__abSpot=!own&&c.ax!=null&&Math.hypot(c.ax-q.x,c.ay-q.y)>6&&sim.mode==='live'?{x:c.ax,y:c.ay}:null;
    /* top kaybı */
    const ow=B.owner?B.owner.id:-1;if(PRFB.last===mi&&ow>=0&&ow!==mi&&sim.players[ow].team!==q.team){if(sim.t-PRFB.lastPassT<3)proPop(pp(-.15,'Pas kesildi'),'n','lost');else proPop(pp(-.2,'Top kaybı'),'n','lost');}
    if(PRFB.last===mi&&ow<0&&sim.t-PRFB.lastPassT>=3&&!sim.pass&&!sim.shot){}if(ow>=0)PRFB.last=ow;
    /* takım arkadaşı pas istiyor */
    if(own&&c.sug>=0&&(c.sugProg||0)>12&&(c.sugPr||0)>.6&&sim.t-PRFB.callT>6){PRFB.callT=sim.t;const tp=abrP(c.sug);proPop(`${esc(tp.short)}: “Pas!”`,'c');}
  }catch(e){}return r;})(abTickCore);
proUI=(old=>function(live){old.apply(this,arguments);try{if(!live){const W=ABM.win;if(W)W.__abSpot=null;}}catch(e){}})(proUI);
proClean=(old=>function(){try{const W=ABM.win;if(W){W.__abSpot=null;const b=W.document.getElementById('abh-pops');if(b)b.remove();}}catch(e){}return old.apply(this,arguments);})(proClean);

