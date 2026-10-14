/* ================= v101: izleme biçimleri mesleğe göre =================
   Futbolcu (Pro): oyuncun sahadayken maç hep canlı ve gerçek zamanlı; FM arası, kritik ana atlama ve kısaltma yok. Akıllı tempo yalnız ölü toplarda hızlandırır.
     Yedekteyken ya da oyundan çıkınca bütün izleme biçimleri yeniden açılır.
   Hakem: FM tarzı yok (pozisyonlar arka planda kaçardı). "Tüm maç" ya da "Sakin anları hızlı geç"; karar anında oyun durur,
     pozisyon önce hakem gözünden yavaş çekimde gösterilir, sonra ne olduğu anlatılır ve karar sorulur; kararın ardından doğrusu ve gerekçesi söylenir. */
const LOCK={key:'',orig:null,prevWatch:null};
function proLive(){try{return !!(PRO.on&&PRO.ei>=0&&ABM.fx&&ABM.fx.pl3&&!MR.out);}catch(e){return false;}}
function lockApply(){const W=ABM.win,S=ABM.fx;if(!W||!S||FX!==S)return;const d=W.document,st=W.ado2d.state;const live=proLive(),ref=refLiveOn();
  W.__abLive=live;W.__abPaceFn=live?((sim,tg)=>sim.mode==='dead'&&st.smart?Math.max(1,Math.min(tg,2.2)):1):null;
  const key=live?'pro':(PRO.on&&S.pl3)?'pro-off':ref?'ref':'';
  const q=id=>d.getElementById(id);
  if(!LOCK.orig){const ww=q('watch-wide'),wk=q('watch-key');LOCK.orig={wide:ww?ww.textContent:'Geniş özet',key:wk?wk.textContent:'Kritik anlar'};}
  if(key==='pro'){if(st.watch!=='wide'){if(LOCK.prevWatch==null)LOCK.prevWatch=st.watch;try{W.ado2d.setWatch('wide');}catch(e){}}}
  else if(LOCK.prevWatch!=null&&key==='pro-off'){try{W.ado2d.setWatch(LOCK.prevWatch);}catch(e){}LOCK.prevWatch=null;}
  if(key==='ref'&&st.watch==='fm'){try{W.ado2d.setWatch('key');}catch(e){}abToast('Hakem modunda “Önemli anlar” yerine “Sakin anları hızlı geç” kullanılır: karar anında oyun yine durur.');}
  const hint=key==='pro'?'Pro modu: oyuncun sahadayken maç canlı ve gerçek zamanlı akar; özet, önemli anlar arası ve ileri sarma yok. Akıllı tempo yalnız ölü toplarda hızlandırır.':
    key==='pro-off'?'Oyuncun sahada değil: izleme biçimini ve hızı dilediğin gibi seçebilirsin. Oyuna girdiğinde maç yeniden canlı akar.':
    key==='ref'?'Hakem modu: karar gerektiren her pozisyonda oyun durur; pozisyon hakem gözünden tekrar gösterilir, ne olduğu anlatılır, kararı sen verirsin.':null;
  const h=q('eng-hint');if(hint&&h&&h.textContent!==hint)h.textContent=hint;
  if(LOCK.key===key)return;LOCK.key=key;
  const seg=q('watch-seg'),fm=q('watch-fm'),ww=q('watch-wide'),wk=q('watch-key'),sk=q('v2d-skip');
  if(seg)seg.style.display=key==='pro'?'none':'';if(sk)sk.style.display=key==='pro'?'none':'';if(fm)fm.style.display=key==='ref'?'none':'';
  if(ww)ww.textContent=key==='ref'?'Tüm maç':LOCK.orig.wide;if(wk)wk.textContent=key==='ref'?'Sakin anları hızlı geç':LOCK.orig.key;
  if(!hint&&h){try{W.ado2d.lenSync();}catch(e){}}}
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{lockApply();}catch(e){console.warn('kilit',e);}return r;})(abTickCore);
fxClose=(old=>function(){try{const W=ABM.win;if(W){W.__abLive=false;W.__abPaceFn=null;}LOCK.key='__';LOCK.prevWatch=null;}catch(e){}return old.apply(this,arguments);})(fxClose);
/* ---------- hakem: önce pozisyonu göster, sonra anlat, sonra sor ---------- */
function abrStory(A){const zone=A.pen?'Ceza sahası içinde':'';
  if(A.kind==='goal'){const sc=A.scorer>=0?abrP(A.scorer):null,n=sc?`${sc.name} (${sc.tm})`:'Hücum oyuncusu',t=A.truth.call,mg=A.vr&&A.vr.margin!=null?Math.abs(A.vr.margin):null;
    return t==='ofs'?`${n} topu ağlara gönderdi! Ama pas anında son savunmacıyla aynı hizada mıydı, önünde miydi? ${mg!=null&&mg<.3?'Fark çok küçük.':'Savunma oyuncuları ofsayt diye bağırıyor.'}`:
      t==='faul'?`${n} golü attı, ancak atak sırasında hücum oyuncusunun savunmacıyla teması var. Rakip oyuncular faul diye hakemin etrafını sardı.`:
      `${n} topu ağlara gönderdi! Rakip oyuncular ofsayt ya da faul var diye itiraz ediyor.`;}
  const d=abrP(A.d),o=abrP(A.o),D=`${d.name} (${d.tm})`,O=`${o.name} (${o.tm})`;
  if(A.clean)return `Ceza sahası içinde ${O} yerde. ${D} topa doğru müdahale etmişti. ${o.tm} oyuncuları penaltı istiyor, ${d.tm} oyuncuları itiraz ediyor.`;
  if(A.dogso>=.4)return `${O} kaleye doğru tek başına gidiyordu; ${D} son adam olarak müdahale etti ve ${o.short} yerde${A.pen?' — ceza sahası içinde':''}.`;
  if(A.sev>=.72)return `${zone?zone+' ':''}${D}, ${O} üzerine yüksek hızda ve kontrolsüz bir müdahalede bulundu. ${o.short} acı içinde yerde, iki takım oyuncuları hakemin etrafında.`;
  if(A.spa>=.5)return `Hızlı atağa çıkan ${O}, ${D} müdahalesiyle durduruldu.${A.pen?' Temas ceza sahası çizgisine çok yakın.':''}`;
  if(A.pen)return `Ceza sahası içinde ${O} ile ${D} arasında temas oldu; ${o.short} yere düştü. ${o.tm} oyuncuları penaltı istiyor.`;
  return `${D} ile ${O} ikili mücadeleye girdi${A.slide?'; kayarak gelen müdahalenin ardından':','} ${o.short} yerde kaldı.${A.nf>=2?` ${d.short} bu maçta ${A.nf}. kez faul yapıyor.`:''}`;}
/* gerçek hakem gibi: pozisyonu yalnız canlı görürsün; tekrar sadece VAR seni monitöre çağırırsa (OFR) */
abrOpen=(old=>function(A){old.apply(this,arguments);ABR.story=abrStory(A);ABR.stage='dec';ABR.rp=0;abrRender();})(abrOpen);
abrRender=(old=>function(){const r=abrRoot();if(!r)return;if(ABR.stage==='intro'){r.innerHTML=`<div class="abr"><div class="abr-hd"><span class="abr-tag">DÜDÜK</span><b>${ABR.min}’</b><span class="sp">Pozisyon hakem gözünden tekrar ediliyor…</span><button type="button" data-r="intro">Geç ▸</button></div></div>`;return;}
  old.apply(this,arguments);try{if(ABR.ask&&ABR.story&&(ABR.stage==='dec'||ABR.stage==='var')){const q=r.querySelector('.abr-q');if(q&&!r.querySelector('.abr-st')){q.insertAdjacentHTML('beforebegin',`<p class="abr-st">${esc(ABR.story)}</p>`);}}}catch(e){}})(abrRender);
abrClick=(old=>function(ev){const b=ev.target.closest('[data-r]');if(b&&b.dataset.r==='intro'){abrIntroEnd();return;}return old.apply(this,arguments);})(abrClick);
function abrIntroEnd(){if(ABR.stage!=='intro')return;try{const W=ABM.win;if(W.ado2d.replaying())W.ado2d.skipReplay();}catch(e){}ABR.stage='dec';abrRender();}
/* tekrar bitince karar ekranı */
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const W=ABM.win;if(ABR.stage==='intro'&&W&&!W.ado2d.replaying()&&performance.now()-(ABR.introT||0)>400)abrIntroEnd();}catch(e){}return r;})(abTickCore);
/* tek tıklama dinleyicisi (sarılmış abrClick'e gider) */
abrRoot=function(){const W=ABM.win;if(!W)return null;const d=W.document;abrCSS(d);let r=d.getElementById('abh-ref');if(!r){r=d.createElement('div');r.id='abh-ref';d.body.appendChild(r);}if(!r.__abrH){r.__abrH=e=>abrClick(e);r.addEventListener('click',r.__abrH);}
  if(!d.getElementById('abr-style2')){const st=d.createElement('style');st.id='abr-style2';st.textContent='.abr-st{margin:0 0 8px;padding:8px 10px;border-left:3px solid #ffc93c;background:rgba(255,255,255,.04);border-radius:0 8px 8px 0;font-size:14px;line-height:1.45;color:#f1f4fa}';d.head.appendChild(st);}return r;};
/* kararın ardından: doğrusu ve gerekçesi */
const ABR_WHYTXT={sert:'ciddi faul: rakibin güvenliğini tehlikeye atan müdahale (Kural 12)',son_adam:'net gol şansını engelleme (DOGSO)',siddet:'şiddetli hareket',taktik:'umut vaat eden atağı durdurma',israrli:'ısrarlı faul',faul:'pervasız müdahale',ikinci_sari:'ikinci sarı kart'};
function abrTruthExplain(A){const T=A.truth;if(A.kind==='goal')return T.call==='gol'?'gol geçerli: pas anında ofsayt yok, faul yok':T.call==='ofs'?'gol geçersiz: pas anında golcü ofsayttaydı':'gol geçersiz: gol öncesi hücumda faul var';
  if(A.clean)return 'faul yok: savunmacı önce topa dokundu, oyun devam etmeliydi';
  const call=T.call==='pen'?'penaltı':A.pen&&T.call==='fk'?'serbest vuruş (temas ceza sahası dışında)':'serbest vuruş';
  const c=T.card,why=ABR_WHYTXT[T.why]||'';return call+(c==='R'?` + kırmızı kart (${why})`:c==='R2'?' + ikinci sarıdan kırmızı':c==='Y'?` + sarı kart (${why})`:' · kart gerekmez (dikkatsiz müdahale)');}
abrFinish=(old=>function(A,D,J,viaVar){const r=old.apply(this,arguments);try{const t=abrTruthExplain(A),ok=J.lvl==='ok';abToast(`${ok?'✔ Doğru':'✖ Doğrusu'}: ${t}.`);try{fxEv(ABR.min||abMin(),`Gözlemci: ${ok?'doğru karar':'hatalı karar'} — ${t}.`,'');}catch(e){}}catch(e){}return r;})(abrFinish);

