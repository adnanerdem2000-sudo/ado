/* ================= v23c: yardımcı antrenör maç izleme + öneriler, spiker anlatımı ================= */
let FX_W=0;
fxOpen=(old=>function(){if(FX&&FX_W){FX.watch=1;FX_W=0;}old();const S=FX;if(!S)return;let v=false;try{v=localStorage.getItem('fxVoice')==='1';}catch(_){}S.voice=v&&'speechSynthesis' in window;
  const tabs=document.querySelector('#fx .fx-tabs');if(tabs&&!tabs.querySelector('[data-k=cm]'))tabs.insertAdjacentHTML('afterbegin',`<button data-fx="tab" data-k="cm">Anlatım</button>`);
  const ctl=document.querySelector('#fx .fx-ctl');if(ctl&&!$('#fxVo'))$('#fxNm').insertAdjacentHTML('afterend',`<button data-fx="voice" id="fxVo" class="${S.voice?'on':''}" title="Sesli spiker">🎙</button>`);
  if(S.watch){const tk=document.querySelector('#fx .fx-tabs [data-k=tk]');if(tk)tk.textContent='Öner';}
  S.tab='cm';fxUI();})(fxOpen);
/* ---------- spiker ---------- */
const COM={
  own:['{n} topu kaptı.','{n} araya girdi, top artık {T} ekibinde.','Top el değiştirdi: {n} kazandı.','{n} ikili mücadeleden topla çıktı.'],
  build:['{n} topla buluştu, oyunu kuruyor.','{n} orta sahada topu çeviriyor.','{T} sabırla pas yapıyor.','{n} başını kaldırdı, pas arıyor.','{T} oyunu yayıyor, {n} kanatta.','{n} kısa paslarla oyunu yönlendiriyor.'],
  att:['{n} hücum bölgesinde hızlandı!','{n} ceza sahasına yaklaşıyor...','Tehlikeli geliyor {T}!','{n} çalımla bir adamı geçti!','{n} savunma arkasına sızmaya çalışıyor!','{T} rakip yarı sahaya yüklendi!'],
  shot:['{n} şutunu çekti...','{n} vurdu!','{n} sert bir vuruş!','{n} plaseyi denedi...','{n} kaleyi yokladı!'],
  sv:['Kaleci {gk} uzanıp çıkardı!','{gk} gole izin vermiyor, harika kurtarış!','{gk} iki hamlede topu kontrol etti.','Kurtarış! {gk} yerinde.'],
  off:['Top az farkla auta gitti.','Şut çerçeveyi bulamadı.','Top üstten auta çıktı.','İsabetsiz, kale vuruşu.'],
  post:['DİREK! Top direkten döndü!','Direkten döndü! Ne şanssızlık!'],
  bl:['Savunma araya girdi, şut bloke edildi.','Şut savunmadan döndü!'],
  g:['GOOOL! {n} ağları sarstı!','Ve gol! {n} affetmedi!','Top ağlarda! {n}!']};
const comPick=(k,o)=>pick(COM[k]).replace(/\{(\w+)\}/g,(_,x)=>o[x]||'');
function fxSay(t,imp){const S=FX;if(!S)return;S.com=S.com||[];if(S.com.slice(0,4).some(c=>c.t===t))return;S.com.unshift({m:fxMin(),t,st:S.t,imp:!!imp});if(S.com.length>80)S.com.length=80;if(imp)fxSpeak(t);}
function fxSpeak(t){const S=FX;if(!S||!S.voice||S.ff||!('speechSynthesis' in window))return;try{const q=speechSynthesis;if(q.pending||q.speaking){if(!/GOL|GOOOL|DİREK|KIRMIZI/.test(t))return;q.cancel();}const u=new SpeechSynthesisUtterance(t.replace(/[“”]/g,''));u.lang='tr-TR';u.rate=1.12;u.pitch=1.05;
  const v=q.getVoices().find(v=>/^tr/i.test(v.lang));if(v)u.voice=v;q.speak(u);}catch(_){}}
function fxCom(dt){const S=FX,B=S.ball,o=B.own;S.comT=(S.comT||0)-dt;if(!o||S.setT>0)return;const T=o.T,u=fxU(T,o.x),d={n:o.sur,T:T.short};
  if(S.comSide!==T.side){S.comSide=T.side;S.comZ=0;if(S.comT<=0&&Math.random()<0.3){fxSay(comPick('own',d));S.comT=7;}return;}
  if(u>72){if(!S.comZ){S.comZ=1;if(S.comT<=2){fxSay(comPick('att',d),u>84);S.comT=6;}}}else{S.comZ=0;if(S.comT<=0&&Math.random()<0.03){fxSay(comPick('build',d));S.comT=18;}}}
fxShoot=(old=>function(c,pr,setK){if(FX)fxSay(setK==='pen'?`${c.sur} penaltı noktasında... vurdu!`:setK==='fk'?`${c.sur} serbest vuruşu kullandı!`:comPick('shot',{n:c.sur}),true);old(c,pr,setK);})(fxShoot);
fxShotEnd=(old=>function(f){const r=f.res,gk=f.gk?f.gk.sur:'kaleci',n=f.from?f.from.sur:'';old(f);if(!FX)return;if(r==='g')fxSay(comPick('g',{n}),true);else if(COM[r])fxSay(comPick(r,{gk,n}),r!=='off');})(fxShotEnd);
fxEv=(old=>function(min,t,cls){old(min,t,cls);const S=FX;if(!S||!S.ev[0])return;S.ev[0].st=S.t;if(/KIRMIZI|penaltı|PENALTI/i.test(t))fxSpeak(t);})(fxEv);
fxTopUI=(old=>function(){old();const S=FX;if(!S)return;const bn=$('#fxBan'),c=(S.com||[])[0],e=S.ev[0];if(bn&&c&&(!e||(c.st||0)>(e.st||0))){bn.textContent=`🎙 ${c.m}’ ${c.t}`;bn.className='fx-ban com';}
  const pb=$('#fxPlay');if(pb)pb.innerHTML=S.phase==='play'&&!S.ff?'<b class="pz">❚❚</b>':'▶';
  if(S.watch){const inf=$('#fxInfo'),j=jobInit();if(inf)inf.textContent=`🧢 Kenardasın · hoca güveni ${Math.round(j.tr)} · öneri ${(S.sug||[]).filter(x=>x.ok).length}/${(S.sug||[]).length}`;}})(fxTopUI);
fxBodyUI=(old=>function(){const S=FX,el=$('#fxBody');if(S&&el&&S.tab==='cm'&&S.phase!=='ht'&&S.phase!=='end'){el.innerHTML=`<ul class="fx-ev fx-com">${(S.com||[]).slice(0,40).map(c=>`<li class="${c.imp?'bold':''}"><i>${c.m}’</i>🎙 ${esc(c.t)}</li>`).join('')||'<li>Maç başlamak üzere...</li>'}</ul>`;return;}
  old();if(S&&S.watch&&el){el.querySelectorAll('[data-fx=advok]').forEach(b=>b.textContent='Hocaya öner');if(S.tab==='tk'||S.tab==='ky'||S.tab==='as')el.insertAdjacentHTML('afterbegin',`<p class="fx-sub" style="color:#ffd23f">Yardımcı antrenörsün: değişiklikler hocaya öneri olarak gider. Hoca mantıklı bulursa uygular.</p>`);}})(fxBodyUI);
fxStep=(old=>function(dt){old(dt);const S=FX;if(!S||S.phase!=='play')return;fxCom(dt);if(S.watch){fxCoachU();fxSugEval();}else if(S.bsk)fxCoachU();})(fxStep);
/* ---------- yardımcı antrenör: hocaya öneri ---------- */
function fxSugOk(k,v){const S=FX,U=S.U,mn=fxMin(),d=S.score[0]-S.score[1];
  if(k==='tac')return (d<0&&(v==='hucum'||v==='pres'))||(d>0&&mn>=70&&v==='savunma')||(d===0&&v==='dengeli');
  if(k==='subin'){const out=U.P.find(p=>p.k===S.sel&&!p.off);return !!out&&(out.st<62||fxR(out)<6.2);}
  if(k==='shout')return (v==='cesaret'&&d<0)||(v==='odak'&&d>0)||(v==='ovgu'&&d>0)||(v==='iste'&&d<=0);
  if(k==='advok')return true;if(k==='htt')return (v==='ofke'&&d<0)||(v==='ovgu'&&d>0)||v==='sakin';
  if(k==='ti'){const p=d<0?{tempo:'yuksek',gen:'genis',hat:'yuksek',pres:'yuksek'}:d>0&&mn>=65?{tempo:'dusuk',hat:'dusuk',kayip:'geri'}:{};return p[v[0]]===v[1];}return false;}
function fxSuggest(k,v,apply,label){const S=FX,j=stG();if(S.t-(S.sugT||-999)<(UP('yr_kulak')?150:240)){toast('Hoca az önce bir önerini değerlendirdi; biraz bekle');return;}S.sugT=S.t;
  const sens=fxSugOk(k,v),p=clamp(0.3+j.tr/220+(j.sk-40)/220+(UP('yr_gps')?0.1:0)+(UP('yr_kulak')?0.05:0)+(sens?0.28:-0.08),0.08,0.95),ok=Math.random()<p,co=coachOf(G.club).n;
  const rec={k,label,ok,sens,t:S.t,m:fxMin(),d0:S.score[0]-S.score[1],x0:S.stats[0].xg-S.stats[1].xg,done:false};(S.sug=S.sug||[]).push(rec);
  if(ok){apply();fxEv(fxMin(),`${co} önerini uyguladı: ${label}.`,'tac');fxSay(`Kenarda hareketlilik: ${co} yardımcısının önerisiyle ${label.toLowerCase()}.`);toast('Hoca önerini kabul etti');}
  else{fxEv(fxMin(),`${co} önerini dinledi ama uygulamadı (${label}).`,'');if(!sens){j.tr=clamp(j.tr-0.5,0,100);}toast('Hoca öneriyi uygulamadı');}fxUI();}
function fxSugEval(){const S=FX;for(const r of S.sug||[]){if(r.done||!r.ok||S.t-r.t<900)continue;r.done=true;const j=stG(),gain=(S.score[0]-S.score[1]-r.d0)+((S.stats[0].xg-S.stats[1].xg)-r.x0)*0.8;
  if(gain>0.15){r.res=1;j.tr=clamp(j.tr+3,0,100);stGrow(1);stBoard(1.5);j.rep=clamp(j.rep+0.5,0,100);fxEv(fxMin(),`Önerin işe yaradı (${r.label}). Hoca sana dönüp başını salladı.`,'tac');}
  else if(gain<-0.3){r.res=-1;j.tr=clamp(j.tr-1.5,0,100);stGrow(-0.3);stBoard(-0.5);fxEv(fxMin(),`Önerin (${r.label}) beklenen etkiyi yaratmadı.`,'');}else r.res=0;}}
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return;
  if(a==='voice'){S.voice=!S.voice&&'speechSynthesis' in window;try{localStorage.setItem('fxVoice',S.voice?'1':'0');}catch(_){}const b=$('#fxVo');if(b)b.classList.toggle('on',S.voice);if(!S.voice&&'speechSynthesis' in window)speechSynthesis.cancel();else fxSpeak('Sesli anlatım açık. İyi seyirler.');toast(S.voice?'Sesli spiker açık':'Sesli spiker kapalı');return;}
  if(!S.watch||S.phase==='end')return old(a,k,v);
  if(a==='ti'){const T0=TI.find(x=>x.k===k),o=T0&&T0.o.find(x=>x[0]===v);return fxSuggest('ti',[k,v],()=>old(a,k,v),`${T0?T0.n:k} → ${o?o[1]:v}`);}
  if(a==='tac')return fxSuggest('tac',k,()=>old(a,k,v),`Yaklaşım: ${TAC[k]?TAC[k].n:k}`);
  if(a==='shout')return fxSuggest('shout',k,()=>old(a,k,v),`Kenardan “${FX_SHOUT[k][0]}”`);
  if(a==='subin'){const out=S.U.P.find(p=>p.k===S.sel&&!p.off),inP=S.U.bench.find(b=>b.k===k);if(!out||!inP)return;return fxSuggest('subin',k,()=>old(a,k,v),`Değişiklik: ${out.sur} ↔ ${ksur(inP.name)}`);}
  if(a==='advok'){const ad=S.adv[+k];if(!ad)return;return fxSuggest('advok',k,()=>old(a,k,v),ad.t.length>60?ad.t.slice(0,58)+'…':ad.t);}
  if(a==='htt'){const j=stG(),p=clamp(0.35+j.tr/200+(UP('yr_psik')?0.15:0)+(fxSugOk('htt',k)?0.2:0),0.1,0.95);if(Math.random()<p){fxEv(45,'Hoca devre arası konuşmasında senin önerini kullandı.','tac');(S.sug=S.sug||[]).push({k:'htt',label:'Devre arası konuşması',ok:true,sens:fxSugOk('htt',k),t:S.t,m:45,d0:S.score[0]-S.score[1],x0:S.stats[0].xg-S.stats[1].xg,done:false});return old(a,k,v);}
    fxEv(45,'Hoca devre arasında kendi konuşmasını yaptı.','');(S.sug=S.sug||[]).push({k:'htt',label:'Devre arası konuşması',ok:false,t:S.t,m:45,done:true});return old(a,'sakin',v);}
  return old(a,k,v);})(fxAct);
function fxCoachU(){const S=FX,U=S.U,mn=fxMin(),d=S.score[0]-S.score[1];S.cuT=(S.cuT||0)+0.1;if(S.cuT<60)return;S.cuT=0;
  if(mn>=58&&U.subs<5){const tired=fxOn(U).filter(p=>p.spos!=='KL'&&(p.st<52||(mn>=70&&fxR(p)<6.0))).sort((a,b)=>a.st-b.st)[0];
    if(tired&&(mn>=64||tired.st<45)&&(U.cuN||0)<(mn>=80?4:mn>=70?3:2)){const inP=U.bench.find(b=>b.pos===tired.pos)||U.bench[0];if(inP&&fxSub(U,tired,inP)){U.cuN=(U.cuN||0)+1;fxEv(mn,`${coachOf(G.club).n} değişiklik yaptı: ${tired.sur} çıktı, ${ksur(inP.name)} girdi.`,'sub');}}}
  if(mn>=65&&d<0&&U.tacK!=='hucum'&&!U.cuH){U.cuH=1;fxSetTi({},'hucum');fxSay(`${coachOf(G.club).n} takımını hücuma kaydırdı.`);}
  if(mn>=80&&d===1&&U.tacK!=='savunma'&&!U.cuD){U.cuD=1;fxSetTi({},'savunma');fxSay(`${coachOf(G.club).n} skoru korumak için savunmaya çekiliyor.`);}}
function yrShadowOn(){const co=coachOf(G.club),f=FMF[co.f]?co.f:'4-2-3-1';const had=G.m;G.m={shadow:1,club:G.club,conf:60,tac:'dengeli',xi:null,budget:0,st:{w:0,d:0,l:0,gf:0,ga:0},rep:30,offers:[]};mgrInit();const m=fmInit();m.fm.f=f;m.fm.roles=null;m.fm.fam=70;fmInit();m.xi=null;mgrXI();return had;}
function yrShadowOff(had){if(had)G.m=had;else delete G.m;}
ACTX.yrWatch=()=>{const f=ourFixture();if(!f||G.staff!=='yrd')return;const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]],had=yrShadowOn();FX_W=1;
  try{fxStart({opp,usHome,neutral:false,onEnd:(gu,go)=>{const S0=yrLastSug;yrShadowOff(had);yrFinish(gu,go,S0);}});}catch(e){yrShadowOff(had);FX_W=0;throw e;}};
let yrLastSug=null;
fxClose=(old=>function(){if(FX&&FX.watch)yrLastSug=(FX.sug||[]).slice();if('speechSynthesis' in window)try{speechSynthesis.cancel();}catch(_){}return old();})(fxClose);
function yrFinish(gu,go,sug){const f=ourFixture();if(!f)return;const usHome=f[0]===G.club,hg=usHome?gu:go,ag=usHome?go:gu;
  const rd=G.s.fixtures[G.s.week-1].map(([h,a])=>{if(h===f[0]&&a===f[1])return [h,a,hg,ag];const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(rd);creditRound(rd,null);
  const j=stG(),win=gu>go,draw=gu===go,notes=[],w=j.wk[G.s.week]||{},hit=(w.trOk?1:0)+(w.anOk?1:0);j.pts+=hit*2+(win?1:0);j.tr=clamp(j.tr+(hit?hit*2.5:-2)+(win?1:draw?0:-1),0,100);
  notes.push(w.tr||w.an?`Hazırlığın: ${w.trOk?'idman planı tuttu':'idman planı etkisiz kaldı'}, ${w.anOk?'rakip analizi isabetliydi':'rakip analizi tutmadı'}.`:'Bu maça hafta içi hazırlık yapmadın.');if(!w.tr&&!w.an)j.tr=clamp(j.tr-3,0,100);
  sug=sug||[];const acc=sug.filter(x=>x.ok).length,good=sug.filter(x=>x.res===1).length;j.pts+=good*2+acc;j.sugN=(j.sugN||0)+sug.length;j.sugA=(j.sugA||0)+acc;j.sugG=(j.sugG||0)+good;
  notes.push(sug.length?`Maç içinde ${sug.length} öneri yaptın; hoca ${acc} tanesini uyguladı, ${good} tanesi sonuç verdi.`:'Maç boyunca hocaya öneri yapmadın.');if(!sug.length)j.tr=clamp(j.tr-1,0,100);
  (j.wlog=j.wlog||[]).unshift({y:seasonLabel(G.s.year),w:G.s.week,opp:CLUBS[usHome?f[1]:f[0]].short,sc:`${gu}-${go}`,n:sug.length,a:acc,g:good});if(j.wlog.length>20)j.wlog.length=20;
  if(win)stBoard(1);else if(!draw)stBoard(-0.5);yrHcCheck();
  msg('report',`Maç sonucu: ${CLUBS[f[0]].name} ${hg}-${ag} ${CLUBS[f[1]].name}`,`${win?'Galibiyet':draw?'Beraberlik':'Mağlubiyet'}. Ligde ${tablePos()}. sıradasınız. ${notes.join(' ')}`);
  G.s.week++;if(G.s.week>NR())staffSeasonEnd();else nextDay();save();render();
  const home=CLUBS[f[0]],away=CLUBS[f[1]];openModal(`<h3>Maç sonucu</h3><div class="res-board"><div class="team">${crestSVG(home,38)}<b>${esc(home.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(away,38)}<b>${esc(away.name)}</b></div></div><ul class="notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Devam</button>`);}
function yrHcCheck(){const j=stG();if(G.staff==='yrd'&&j.rep>=55&&!j.hcMid&&!j.hcAcc&&Math.random()<0.012*(j.rep-50)){const ids=mgrJobOffers(Math.round(j.rep*0.6),1).filter(id=>id!==G.club);if(ids.length){j.hcMid=ids[0];msg('board','Teknik direktörlük teklifi',`${CLUBS[ids[0]].name} yönetimi seni teknik direktör olarak istiyor. Merkez ekranından karar verebilirsin.`);}}}
viewStaffHub=(old=>function(){let h=old();if(!isStaff()||G.phase!=='season')return h;
  if(G.staff==='yrd'){h=hcMidHTML()+h;if(dayType(G.s.day)==='mac'&&ourFixture())h=h.replace('<button class="cta big" data-act="stMatch"><span>Maç gününe çık</span><small>Takım sahaya çıkıyor · sonuç</small></button>',
    `<div class="day-ctas"><button class="cta big" data-act="yrWatch"><span>Maçı kenardan izle</span><small>2B maç · hocaya öneri yap</small></button><button class="btn" data-act="stMatch">Sadece sonucu gör</button></div>`);}
  return h;})(viewStaffHub);
function viewYrAn(){const j=stG(),n=j.sugN||0,a=j.sugA||0,g=j.sugG||0,L=j.wlog||[];
  return `<h2 class="h">Analiz</h2>${staffCard()}<section class="panel"><p class="sub-h"><span>Maç içi öneriler</span><span>bu sezon</span></p><div class="strip"><div><b>${n}</b><span>Öneri</span></div><div><b>${n?Math.round(a/n*100):0}%</b><span>Kabul</span></div><div><b>${g}</b><span>Sonuç veren</span></div><div><b>${Math.round(j.tr)}</b><span>Hoca güveni</span></div></div>
   <p class="muted" style="margin:8px 0 0">Maç gününde “Maçı kenardan izle” ile 2B maçı izlersin. Taktik, kenardan seslenme, oyuncu değişikliği ve asistan önerileri doğrudan uygulanmaz; hocaya önerilir. Hoca güveni yüksekse ve önerin maçın durumuna uygunsa kabul eder. Kabul edilen önerinin sonraki 15 dakikada skora ya da pozisyonlara etkisi değerlendirilir.</p></section>
   <section class="panel"><p class="sub-h"><span>Son maçlar</span></p><ul class="cupres">${L.map(x=>`<li><span>${x.w}. hf</span><b>${esc(x.opp)} · ${x.sc}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${x.n} öneri · ${x.a} kabul · ${x.g} sonuç verdi</small></b><em class="${x.g?'res-w':''}">${x.g?'+':''}${x.g}</em></li>`).join('')||'<li><b>Henüz kenardan izlediğin maç yok</b></li>'}</ul></section>`;}
staffNew=(old=>function(){const j=jobInit();j.sugN=0;j.sugA=0;j.sugG=0;return old();})(staffNew);
jobInit=(old=>function(){if(G&&G.m&&G.m.shadow&&!FX)delete G.m;return old();})(jobInit);

