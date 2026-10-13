/* ================= v104: güncel hakem teknolojileri =================
   Gol çizgisi teknolojisi (GLT): top çizgiyi tamamen geçince hakemin saatine "GOL" uyarısı gider (IFAB Kural 1/10).
   Çipli top + yarı otomatik ofsayt (SAOT): top içindeki sensör (saniyede 500 veri) vuruş anını, kameralar oyuncu iskeletini ölçer; ofsayt çizgisi otomatik çekilir.
   Kullanım: UEFA maçları ve büyük beş lig; Süper Lig'de TFF'nin planına göre 2026-27 ikinci yarısından (ocak) itibaren.
   Hakem kendi GLT saatini mağazadan alırsa sistemli statlarda sinyal anında bileğine gelir; saati yoksa kararı kendisi verir, VAR düzeltir. */
function techLeague(F){try{if(!F)return false;if(F.uefa)return true;const L=LEAGUES[F.lid]||{};if((L.tier||0)>=9)return true;if(F.lid==='sl')return G.s.year>2026||(G.s.week||0)>=18;return false;}catch(e){return false;}}
const hasGLT=F=>techLeague(F),hasSAOT=F=>techLeague(F);
function refWatch(){try{return !!(G&&G.p&&G.p.up&&G.p.up.ref_glt);}catch(e){return false;}}
function refComms(){try{return !!(G&&G.p&&G.p.up&&G.p.up.ref_com);}catch(e){return false;}}
/* mağaza: hakem ekipmanı */
SHOP_DR.hakem={n:'Hakem ekipmanı',items:[
  ['ref_glt','GLT uyumlu hakem saati','Gol çizgisi teknolojisi olan statlarda top çizgiyi geçtiği an bileğin titrer, ekranda “GOL” yazar. Çizgide kurtarışlarda da “gol değil” bilgisi gelir.',E2U(4500),0,2,{g:'saat'}],
  ['ref_com','Profesyonel iletişim seti','Yardımcı hakemlerle ve VAR odasıyla kesintisiz bağlantı: danıştığında aldığın görüşler daha isabetli olur.',E2U(2800),0,2,{g:'kulak'}],
  ['ref_fit','Kişisel kondisyon programı','Maç sonunda gözlemci notun +0,1 (koşu mesafesi ve pozisyon alma).',E2U(6000),0,3,{g:'tablet'}]]};
shopFor=(old=>function(){const o=old.apply(this,arguments);try{if(isRef())o.hakem=SHOP_DR.hakem;else if(o&&o.hakem)delete o.hakem;}catch(e){}return o;})(shopFor);
gearSVG=(old=>function(o){if(o&&o.g==='saat')return `<svg viewBox="0 0 164 80" class="ill"><ellipse cx="82" cy="74" rx="64" ry="4" fill="rgba(0,0,0,.22)"/><rect x="70" y="2" width="24" height="16" rx="4" fill="#2a2f38"/><rect x="70" y="58" width="24" height="16" rx="4" fill="#2a2f38"/><rect x="58" y="14" width="48" height="48" rx="12" fill="#1b1f27" stroke="#8a96a3" stroke-width="2"/><rect x="64" y="20" width="36" height="36" rx="8" fill="#0d3b23"/><text x="82" y="43" text-anchor="middle" font-family="Barlow Condensed,Inter,sans-serif" font-weight="800" font-size="14" fill="#35d49a">GOL</text></svg>`;return old.apply(this,arguments);})(gearSVG);
/* ---------- canlı hakem: gol çizgisi kararları ---------- */
abrSetupSim=(old=>function(sim){old.apply(this,arguments);sim.refGlFn=inf=>{if(ABM.ff||!refLiveOn())return false;if(hasGLT(REF.F)&&refWatch()){abrGltSignal(inf.truth.call==='gol');return false;}return true;};})(abrSetupSim);
function abrGltSignal(gol){abToast(gol?'⌚ Saat titredi: GOL! Top çizgiyi tamamen geçti.':'⌚ Saat: gol değil. Top çizgiyi tamamen geçmedi.');try{fxEv(abMin(),gol?'Gol çizgisi teknolojisi: GOL.':'Gol çizgisi teknolojisi: gol değil.','');}catch(e){}REF.rt+=.02;}
/* çizgi gollerinde soru, saat varsa otomatik */
abrWantGoal=(old=>function(gi){if(gi.gl&&gi.truth.call==='gol'&&refLiveOn()&&!ABM.ff){if(hasGLT(REF.F)&&refWatch()){abrGltSignal(true);return false;}gi.line=1;return true;}return old.apply(this,arguments);})(abrWantGoal);
abrCalls=(old=>function(A){if(A.kind==='gline'||(A.kind==='goal'&&A.line))return [['gol','Gol: top çizgiyi geçti'],['nogol','Gol değil']];return old.apply(this,arguments);})(abrCalls);
abrQ=(old=>function(A){if(A.kind==='gline'||(A.kind==='goal'&&A.line)){const s=A.scorer>=0?abrP(A.scorer):null;return `Gol çizgisi: <b>${esc(s?s.name:'?')}</b> <i>(${esc(s?s.tm:'')})</i> vuruşu`;}return old.apply(this,arguments);})(abrQ);
abrWhere=(old=>function(A){return A.kind==='gline'||(A.kind==='goal'&&A.line)?'Kale çizgisi':old.apply(this,arguments);})(abrWhere);
abrStory=(old=>function(A){if(A.kind==='gline'||(A.kind==='goal'&&A.line)){const k=abrP(A.kind==='gline'?A.gk:-1),s=A.scorer>=0?abrP(A.scorer):null;return `${s?s.name+' vurdu, ':''}kaleci ${A.kind==='gline'?k.name+' ':''}topu çizginin üzerinde çıkardı mı, yoksa top içeri girdi mi? Hücum oyuncuları gol diye koşuyor.`;}return old.apply(this,arguments);})(abrStory);
abrCues=(old=>function(A){if(A.kind==='gline'||(A.kind==='goal'&&A.line)){const gol=A.kind==='goal',L=[];const sees=Math.random()<.6;L.push(sees?(gol?'Top kalecinin arkasında, çizginin içinde gibi':'Top çizginin üzerinde, tamamı geçmemiş gibi'):'Kalabalık yüzünden çizgiyi net göremedin');
    L.push(hasGLT(REF.F)?(refWatch()?'Saat sinyali bekleniyor':'Bu statta gol çizgisi teknolojisi var ama saatin yok: VAR sistemi görüyor'):'Bu statta gol çizgisi teknolojisi yok');return L;}return old.apply(this,arguments);})(abrCues);
abrTruthExplain=(old=>function(A){if(A.kind==='gline')return 'gol değil: top çizgiyi tamamen geçmedi';if(A.kind==='goal'&&A.line)return 'gol: top çizgiyi tamamen geçti';return old.apply(this,arguments);})(abrTruthExplain);
abrDecTxt=(old=>function(A,D){if(A.kind==='gline'||(A.kind==='goal'&&A.line))return D.call==='gol'?'gol':'gol değil';return old.apply(this,arguments);})(abrDecTxt);
abrAnsTxt=(old=>function(A,t){if(A.kind==='gline'||(A.kind==='goal'&&A.line))return t==='gol'?'top içeride, gol':'top çizgide kaldı, gol değil';return old.apply(this,arguments);})(abrAnsTxt);
abrTruthOf=(old=>function(A){if(A.kind==='gline')return 'nogol';if(A.kind==='goal'&&A.line)return 'gol';return old.apply(this,arguments);})(abrTruthOf);
abrWrong=(old=>function(A){if(A.kind==='gline')return 'gol';if(A.kind==='goal'&&A.line)return 'nogol';return old.apply(this,arguments);})(abrWrong);
abrJudge=(old=>function(A,D){if(A.kind==='gline'||(A.kind==='goal'&&A.line)){const t=abrTruthOf(A);return {lvl:D.call===t?'ok':'big'};}return old.apply(this,arguments);})(abrJudge);
abrOpen=(old=>function(A){if(A.kind!=='gline')return old.apply(this,arguments);ABR.ask=A;ABR.open=1;ABR.stage='dec';ABR.min=abMin();ABR.minz=0;ABR.sel={call:null};ABR.cues=abrCues(A);ABR.voices=[];ABR.warn=[];ABR.first=null;ABR.story=abrStory(A);ABR.asked={};abrRender();})(abrOpen);
/* VAR yazıları: GLT ve SAOT verisiyle */
abrVarText=(old=>function(A,D){if(A.kind==='gline'||(A.kind==='goal'&&A.line))return hasGLT(REF.F)?'Hocam, gol çizgisi sistemi farklı gösteriyor. Monitöre davet ediyoruz.':'Hocam, çizgi pozisyonunu bir de monitörde görmeni öneriyoruz.';return old.apply(this,arguments);})(abrVarText);
abrVarCues=(old=>function(A){if(A.kind==='gline')return [hasGLT(REF.F)?'GLT: top çizgiyi tamamen geçmedi':'Kale arkası kamera: topun bir kısmı çizginin üzerinde'];if(A.kind==='goal'&&A.line)return [hasGLT(REF.F)?'GLT: top çizgiyi tamamen geçti':'Kale arkası kamera: top tamamen içeride'];
  const L=old.apply(this,arguments);try{if(A.kind==='goal'&&A.truth.call==='ofs'&&hasSAOT(REF.F)){const mg=A.vr&&A.vr.margin!=null?Math.abs(A.vr.margin):.2;L.unshift(`🛰 Yarı otomatik ofsayt: çipli top vuruş anını işaretledi, golcü ${Math.max(3,Math.round(mg*100))} cm önde`);}}catch(e){}return L;})(abrVarCues);
/* ofsayt kararlarında SAOT verisi */
abrCues=(old=>function(A){const L=old.apply(this,arguments);try{if(A.kind==='offs'&&hasSAOT(REF.F)&&A.mo!=null){const cm=Math.max(2,Math.round(Math.abs(A.mo)*100));L.push(`🛰 Yarı otomatik ofsayt (çipli top): ${A.mo>0?`${cm} cm önde, ofsayt`:`${cm} cm geride, ofsayt yok`}`);}}catch(e){}return L;})(abrCues);
/* iletişim seti: danışmalar daha isabetli */
abrAccuracy=(old=>function(A,who){let a=old.apply(this,arguments);if(refComms()&&who!=='var')a=Math.min(.95,a+.08);if(who==='var'&&(A.kind==='gline'||(A.kind==='goal'&&A.line))&&hasGLT(REF.F))a=1;return a;})(abrAccuracy);
/* kondisyon programı */
refFinish=(old=>function(){try{if(REF&&G.p.up&&G.p.up.ref_fit)REF.rt+=.1;}catch(e){}return old.apply(this,arguments);})(refFinish);
/* VAR sonrası stadyum anonsu (IFAB denemesi: hakem kararı seyirciye açıklar) */
abrFinish=(old=>function(A,D,J,viaVar){const r=old.apply(this,arguments);try{if(viaVar&&(REF.F&&(REF.F.uefa||techLeague(REF.F)))){abToast(`📣 Stadyum anonsu: “İnceleme sonrası karar: ${abrDecTxt(A,D)}.”`);}}catch(e){}return r;})(abrFinish);
/* ---------- diğer meslekler: maç anlatımında teknoloji ---------- */
function fxTechOn(){try{const S=FX;if(!S)return false;const c=CLUBS[G.club];const lid=c&&c.league;return techLeague({lid,uefa:!!(S.o&&S.o.uefa)});}catch(e){return false;}}
abEv=(old=>function(e){const r=old.apply(this,arguments);try{if(!FX||!FX.ab||refLiveOn())return r;if(e.type==='VAR'&&e.meta&&/ofsayt/.test(e.meta.reason||'')&&fxTechOn()){const cm=Math.max(3,Math.round(Math.abs(e.meta.margin||.15)*100));fxEv(abMin(),`🛰 Yarı otomatik ofsayt: çipli top pas anını işaretledi, fark ${cm} cm.`,'');}
    if(e.type==='GOAL'&&fxTechOn()&&Math.random()<.12)fxEv(abMin(),'⌚ Gol çizgisi teknolojisi hakemin saatine “GOL” sinyalini gönderdi.','');}catch(x){}return r;})(abEv);
abrType=(old=>function(A){if(A.kind==='gline'||(A.kind==='goal'&&A.line))return 'gline';return old.apply(this,arguments);})(abrType);
REF_TN.gline='Gol çizgisi';

