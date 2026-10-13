/* ================= v99: maç içi yapay zekâ — motor verisini okuyan hocalar =================
   1) Kullanıcının motorda (Adoball talimat panelinde) seçtiği talimatlar rakip hocaya görünür olur: rakip gerçekten neye karşı oynadığını bilir.
   2) Rakip hoca motor istatistiklerine göre tepki verir: kontraya yakalanınca çizgiyi çeker, kapanan rakibe karşı kanat/orta/uzaktan şut, kanatta ikili, yorgunlukta baskıyı keser.
   3) Kullanıcının yönetmediği maçlarda (futbolcu, hakem, tribün) kendi takımının hocası da yönetir: değişiklik, skora göre yaklaşım, kart riski, 10 kişi. */
/* ---------- 1) motor talimatı → FX talimatı (yalnız okuma: rakip hoca ve asistan bunu görür) ---------- */
function abTacBack(S){const W=ABM.win,sim=ABM.sim;if(!W||!sim)return;const e=abS2E(0);if(W.__abMine!==e)return;let t;try{t=sim.teams[e].tac;}catch(x){return;}if(!t)return;const U=S.U,ti=U.ti=U.ti||{};
  const v=(x,a,b,c)=>x>0?a:x<0?b:c;ti.tempo=v(t.tempo,'yuk','dus','nor');ti.hat=v(t.line,'yuksek','derin','orta');ti.pres=v(t.press,'yuk','dus','orta');ti.gen=v(t.width,'gen','dar','nor');
  const k=t.ment>0?'hucum':t.ment<0?'savunma':(t.press>0&&t.line>0?'pres':'dengeli');if(U.tacK!==k){U.tacK=k;}}
/* ---------- yardımcılar ---------- */
function taiName(T){try{const c=coachOf(T.id);if(c&&c.n)return c.n;}catch(e){}return `${T.short} hocası`;}
function taiSub(T,kind){if((T.subs||0)>=5||!T.bench||!T.bench.length)return null;const mn=fxMin(),on=fxOn(T).filter(p=>p.spos!=='KL'&&p.k!=='ME');let out,inP;const bench=T.bench.filter(b=>b.k!=='ME');if(!bench.length)return null;
  if(kind==='atk'){out=on.filter(p=>p.pos==='DF'||p.pos==='OS').sort((a,b)=>fxR(a)-fxR(b)||a.st-b.st)[0];inP=bench.filter(b=>b.pos==='FW'||b.pos==='KN').sort((a,b)=>b.ovr-a.ovr)[0];}
  else if(kind==='def'){out=on.filter(p=>p.pos==='FW'||p.pos==='KN').sort((a,b)=>a.st-b.st)[0];inP=bench.filter(b=>b.pos==='DF'||b.pos==='OS').sort((a,b)=>b.ovr-a.ovr)[0];}
  else if(kind==='card'){out=on.filter(p=>p.yel&&!p.red&&(p.pos==='DF'||p.pos==='OS')).sort((a,b)=>(b.a&&b.a.agr||50)-(a.a&&a.a.agr||50))[0];inP=out&&(bench.find(b=>b.pos===out.pos)||bench[0]);}
  else if(kind==='poor'){out=on.filter(p=>fxR(p)<5.9).sort((a,b)=>fxR(a)-fxR(b))[0];inP=out&&(bench.find(b=>b.pos===out.pos)||bench[0]);}
  else{out=on.filter(p=>p.st<60).sort((a,b)=>a.st-b.st)[0];inP=out&&(bench.find(b=>b.pos===out.pos)||bench[0]);}
  if(out&&inP&&fxSub(T,out,inP))return [out,inP];return null;}
function taiSay(T,txt){try{fxEv(fxMin(),`🧠 ${taiName(T)}: ${txt}`,'tac');}catch(e){}}
function taiSet(T,ti,tac){if(ti)T.ti=Object.assign({},T.ti||{},ti);if(tac)T.tacK=tac;try{T.tac=fxTac(T.ti,T.tacK);}catch(e){}}
/* ---------- 2) rakip hoca: motor verisine göre ---------- */
function oaiEng(S){const O=S.O,U=S.U,A=S.oai,sim=ABM.sim;if(!sim)return;const F=(A&&A.f)||(S.oaiF=S.oaiF||{}),mn=fxMin(),d=S.score[1]-S.score[0],eU=abS2E(0),eO=abS2E(1),su=sim.teams[eU].st,so=sim.teams[eO].st,tu=sim.teams[eU].tac||{};
  const say=t=>{if(A&&typeof oaiDo==='function')oaiDo(t);else taiSay(O,t);};
  /* kontraya yakalanıyor: savunma çizgisini çek */
  if(mn>=20&&!F.ctrD&&(su.ctr||0)>=4&&(su.xg||0)>(so.xg||0)&&O.ti&&O.ti.hat!=='derin'){F.ctrD=1;taiSet(O,{hat:'derin'},O.tacK==='hucum'?'dengeli':null);say('Kontralarla yakalandığını gördü: savunma çizgisini geri çekti, arkasında boşluk bırakmıyor.');if(A&&typeof oaiApply==='function')oaiApply();return true;}
  /* rakip (kullanıcı) kapandı ve üretemiyor: kanat, orta, uzaktan şut */
  if(mn>=30&&!F.open&&(tu.ment<0||tu.line<0)&&(so.xg||0)<.6&&d<=0){F.open=1;taiSet(O,{gen:'gen',orta:'bol',uzak:'evet'});say('Kapanan savunmayı açmak için oyunu genişletti: kanatlardan orta ve ceza sahası dışından şut.');if(A&&typeof oaiApply==='function')oaiApply();return true;}
  /* kullanıcı geniş oynuyor: kanatta ikili */
  if(mn>=25&&!F.wid&&tu.width>0&&(su.corners||0)>=4){F.wid=1;taiSet(O,{gen:'gen'});say('Kanat ataklarımıza karşı kanatlarda ikili savunma kuruyor.');if(A&&typeof oaiApply==='function')oaiApply();return true;}
  /* öndeyken rakip (kullanıcı) önde baskı yapıyor: uzun topla arkaya */
  if(mn>=35&&!F.dir&&d>0&&tu.press>0&&tu.line>0){F.dir=1;taiSet(O,{pas:'direkt',arka:'evet'});say('Önde baskımızı atlatmak için uzun toplarla savunma arkasına oynuyor.');if(A&&typeof oaiApply==='function')oaiApply();return true;}
  /* kendi takımı yoruldu: baskıyı kes */
  const avgO=fxOn(O).reduce((a,p)=>a+(p.st||100),0)/Math.max(1,fxOn(O).length);if(mn>=60&&avgO<58&&!F.tirO&&O.ti&&O.ti.pres==='yuk'){F.tirO=1;taiSet(O,{pres:'orta',tempo:'nor'});say('Oyuncuları yorulunca önde baskıyı bıraktı, orta sahada bekliyor.');if(A&&typeof oaiApply==='function')oaiApply();return true;}
  /* sarı kartlı agresif savunmacı: kırmızı riski */
  if(mn>=55&&(O.subs||0)<5&&!F.cardO&&Math.random()<.5){const r=taiSub(O,'card');if(r){F.cardO=1;say(`Sarı kartlı ${r[0].sur} kırmızı riskine karşı oyundan alındı, ${ksur(r[1].name)} girdi.`);return true;}}
  /* verimsiz oyuncu */
  if(mn>=62&&(O.subs||0)<5&&!F.poorO&&Math.random()<.45){const r=taiSub(O,'poor');if(r){F.poorO=1;say(`Etkisiz kalan ${r[0].sur} yerine ${ksur(r[1].name)}.`);return true;}}
  return false;}
fxCoachAI=(old=>function(){const S=FX;if(S&&S.ab&&ABM.sim){try{abTacBack(S);}catch(e){}try{if(oaiEng(S))return true;}catch(e){console.warn('oai motor',e);}}return old.apply(this,arguments);})(fxCoachAI);
/* ---------- 3) kendi takımımızın hocası (kullanıcı yönetmiyorsa) ---------- */
function uaiOn(S){return !!(S&&S.ab&&(S.pl3||S.ref3||S.scr)&&!S.watch);}
function uaiBrain(S){const U=S.U,O=S.O,mn=fxMin(),d=S.score[0]-S.score[1],F=U.uaiF=U.uaiF||{};if(!U.ti)U.ti={};
  const redU=U.P.filter(p=>p.off&&!p.subbed).length,redO=O.P.filter(p=>p.off&&!p.subbed).length;
  if(redU>(F.redU||0)){F.redU=redU;const r=d>=0?taiSub(U,'def'):null;taiSet(U,{hat:'derin',gen:'dar'},d>=0?'savunma':null);taiSay(U,`10 kişi kaldık; blok geriye çekildi${r?`, ${r[0].sur} yerine ${ksur(r[1].name)}`:''}.`);return;}
  if(redO>(F.redO||0)){F.redO=redO;taiSet(U,{pres:'yuk',gen:'gen'},d<=0?'hucum':null);taiSay(U,'Rakip eksik kaldı: baskı artırıldı, oyun genişletildi.');return;}
  if(S.half===2&&mn<=50&&d<0&&!F.ht){F.ht=1;const r=taiSub(U,'atk');taiSet(U,{tempo:'yuk'});taiSay(U,`Devre arasında takımı uyardı${r?`; ${ksur(r[1].name)} oyunda`:''}. Tempo yükseldi.`);return;}
  if(mn>=60&&d<0&&!F.atk){F.atk=1;const r=taiSub(U,'atk');taiSet(U,{tempo:'yuk',orta:'bol'},'hucum');taiSay(U,`Hücuma geçti${r?`: ${r[0].sur} çıktı, ${ksur(r[1].name)} girdi`:''}.`);return;}
  if(mn>=80&&d<0&&!F.all){F.all=1;const r=taiSub(U,'atk');taiSet(U,{hat:'yuksek',orta:'bol',yog:'cok'},'hucum');taiSay(U,`Son dakikalarda her şeyi ortaya koydu${r?` (${ksur(r[1].name)})`:''}.`);return;}
  if(mn>=75&&d===1&&!F.prot){F.prot=1;const r=taiSub(U,'def');taiSet(U,{hat:'derin',tempo:'dus'},'savunma');taiSay(U,`Skoru korumaya geçti${r?`: ${r[0].sur} yerine ${ksur(r[1].name)}`:''}.`);return;}
  if(mn>=70&&d>=2&&!F.man){F.man=1;taiSet(U,{tempo:'dus',pres:'orta'},'dengeli');taiSay(U,'Fark rahat: tempo düştü, oyuncular dinlendiriliyor.');return;}
  if(mn>=56&&(U.subs||0)<5){const lim=mn>=80?5:mn>=70?4:mn>=62?3:2;if((U.subs||0)<lim){const r=taiSub(U,'tired')||(mn>=55&&taiSub(U,'card'))||(mn>=65&&taiSub(U,'poor'));if(r){taiSay(U,`Değişiklik: ${r[0].sur} çıktı, ${ksur(r[1].name)} girdi.`);return;}}}}
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const S=ABM.fx;if(uaiOn(S)&&FX===S&&ABM.sim&&!ABM.ff){const sim=ABM.sim;const t=sim.t;if(S.uaiT==null)S.uaiT=t;if(t-S.uaiT>=40){S.uaiT=t;uaiBrain(S);try{abTacSync(S);}catch(e){}}}}catch(e){console.warn('takım hocası',e);}return r;})(abTickCore);

