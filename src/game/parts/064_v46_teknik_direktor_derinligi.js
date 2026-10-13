/* ================= v46: teknik direktör derinliği ================= */
/* ---------- rakibe özel talimatlar ---------- */
function oiOpp(){try{const n=nextOppInfo();return n&&n.opp&&CLUBS[n.opp.id]?n.opp:null;}catch(e){return null;}}
function oiGet(id){const m=G.m;m.oi=m.oi||{};return m.oi[id]=m.oi[id]||{mark:'',weak:'',press:'nor'};}
const FMA_C={};const fmA=(p,n)=>{try{let X=FMA_C[p.k+'|'+p.ovr];if(!X){X={};const A=fmAttrs(p);for(const g of ['T','M','P','K'])for(const [k,v] of (A[g]||[]))X[k]=v;FMA_C[p.k+'|'+p.ovr]=X;}const v=X[n];return v==null?10:v;}catch(e){return 10;}};
function oiProf(id){const sq=squadOf(id).sort((a,b)=>b.ovr-a.ovr),xi=sq.slice(0,11),avg=xi.reduce((a,p)=>a+p.ovr,0)/Math.max(1,xi.length);
  const out=xi.filter(p=>p.pos!=='KL'),star=out[0],dfs=sq.filter(p=>p.pos==='DF').slice(0,4),weak=dfs.slice().sort((a,b)=>a.ovr-b.ovr)[0];
  const at=(p,i)=>pAttrs(p)[i][1],pas=out.reduce((a,p)=>a+at(p,1),0)/Math.max(1,out.length),hiz=out.reduce((a,p)=>a+at(p,3),0)/Math.max(1,out.length);
  return {xi,avg,star,weak,dfAvg:dfs.reduce((a,p)=>a+p.ovr,0)/Math.max(1,dfs.length),pas,hiz,imp:star?clamp((star.ovr-avg)/6,0,1.5):0};}
function oiMods(opp){const r={u:1,o:1,txt:[]};if(!G.m||!opp||!CLUBS[opp.id])return r;const O=G.m.oi&&G.m.oi[opp.id];if(!O)return r;const P=oiProf(opp.id);
  if(O.mark){if(P.star&&O.mark===P.star.k){r.o*=1-0.04-0.05*P.imp;r.txt.push('yıldıza yakın markaj');}else r.o*=0.985;}
  if(O.weak){if(P.weak&&O.weak===P.weak.k){r.u*=1+0.04+clamp((P.dfAvg-P.weak.ovr)/30,0,0.07);r.txt.push('zayıf halkaya yüklenme');}else r.u*=1.008;}
  if(O.press==='yuksek'){r.u*=1+clamp((72-P.pas)/90,-0.05,0.09);r.o*=1.03*(1+clamp((P.hiz-70)/150,-0.03,0.06));}
  else if(O.press==='dus'){r.u*=0.95;r.o*=0.95-clamp((P.hiz-70)/150,0,0.04);}
  return r;}
/* ---------- duran top rutinleri ---------- */
const SPR_CK={hedef:['Hedef adama','En iyi kafacıya ön direkte orta'],kalabalik:['Ceza sahasına yüklen','Uzun boylular arka direğe koşar'],kisa:['Kısa korner','Kısa paslaşıp açıdan orta']};
const SPR_DF={adam:['Adam adama','Markajı iyi savunmalar için'],alan:['Alan savunması','Pozisyon alması iyi takımlar için']};
function sprGet(){const m=G.m;m.spr=m.spr||{ck:'hedef',df:'alan'};return m.spr;}
function sprFit(){const sq=squadOf(G.club),xi=mgrXI().map(k=>sq.find(p=>p.k===k)).filter(Boolean),out=xi.filter(p=>p.pos!=='KL');if(!out.length)return {ck:{},df:{}};
  const hd=out.map(p=>fmA(p,'Kafa Vuruşu')+fmA(p,'Zıplama')*0.5).sort((a,b)=>b-a),cr=Math.max(...out.map(p=>fmA(p,'Orta Yapma')+fmA(p,'Teknik')*0.5)),dfs=out.filter(p=>p.pos==='DF'||p.pos==='OS');
  const mk=dfs.reduce((a,p)=>a+fmA(p,'Markaj'),0)/Math.max(1,dfs.length),pz=dfs.reduce((a,p)=>a+fmA(p,'Pozisyon Alma'),0)/Math.max(1,dfs.length);
  return {ck:{hedef:clamp((hd[0]-25)/3.5,-1,1.3),kalabalik:clamp((hd.slice(0,5).reduce((a,b)=>a+b,0)/5-21.5)/3,-1,1.3),kisa:clamp((cr-24.5)/3.5,-1,1.3)},df:{adam:clamp((mk-13.5)/2.5,-1,1.2),alan:clamp((pz-13.5)/2.5+0.1,-1,1.2)}};}
function sprMods(){const s=sprGet(),F=sprFit();const lv=(G.m.sp!=null?G.m.sp:50)/100;return {u:1+0.03*(F.ck[s.ck]||0)*(0.6+lv*0.8),o:1-0.025*(F.df[s.df]||0)*(0.6+lv*0.8)};}
function mgrMods(opp){const a=oiMods(opp),b=sprMods(),c=cultTacMod();return {u:a.u*b.u*c,o:a.o*b.o};}
const cultTacMod=()=>1;
/* FX entegrasyonu */
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&FX&&FX.O&&o&&o.opp){const O=G.m.oi&&G.m.oi[o.opp.id];if(O){
    if(O.mark){const p=FX.O.P.find(x=>x.k===O.mark);if(p){for(const k of ['sh','pa','dr'])p.a[k]=p.a[k]*0.9;if(p.fa)for(const n of ['Bitiricilik','Pas','Dripling','Karar Alma','Vizyon'])if(p.fa[n]!=null)p.fa[n]=Math.max(1,p.fa[n]-2.5);p.marked=1;}}
    if(O.weak){const p=FX.O.P.find(x=>x.k===O.weak);if(p){p.a.df=p.a.df*0.9;if(p.fa)for(const n of ['Markaj','Top Kapma','Pozisyon Alma'])if(p.fa[n]!=null)p.fa[n]=Math.max(1,p.fa[n]-2);}}
    if(O.press!=='nor'){const t=FX.U.tac;if(O.press==='yuksek'){t.zone+=15;t.pressN=Math.min(4,t.pressN+1);t.line+=3;}else{t.zone=Math.max(25,t.zone-15);t.line-=4;}}
    fxEv(0,`Rakibe özel plan: ${[O.mark?'yakın markaj':'',O.weak?'zayıf halkaya yüklenme':'',O.press==='yuksek'?'yoğun pres':O.press==='dus'?'derin blok':''].filter(Boolean).join(', ')||'standart'}.`,'tac');}}}catch(e){console.warn(e);}return r;})(fxStart);
fxDecide=(old=>function(c){if(c&&c.cornerTake&&FX)FX.ckNow=c.T;return old.apply(this,arguments);})(fxDecide);
fxCross=(old=>function(c){const S=FX;let undo=null;try{if(S&&S.ckNow&&S.ckNow===c.T&&G.mode==='mgr'){S.ckNow=null;const s=sprGet(),bump=[];const add=(p,n,v)=>{if(p&&p.fa&&p.fa[n]!=null){p.fa[n]+=v;bump.push([p,n,v]);}};
      if(c.T===S.U){const on=fxOn(S.U).filter(q=>q!==c&&q.spos!=='KL');if(s.ck==='hedef'){const b=on.sort((a,b)=>fxAirA(b)-fxAirA(a))[0];if(b){b.x=fxX(S.U,FXL-11);b.y=34+(Math.random()-0.5)*4;add(b,'Kafa Vuruşu',1.5);}}else if(s.ck==='kalabalik')on.forEach(q=>add(q,'Kafa Vuruşu',1.2));else if(s.ck==='kisa'){add(c,'Orta Yapma',3);add(c,'Teknik',2);}}
      else{const F=sprFit().df[sprGet().df]||0;fxOn(S.U).forEach(q=>add(q,'Markaj',F*1.5));}
      undo=bump;}}catch(e){console.warn(e);}
  try{return old.apply(this,arguments);}finally{if(undo)for(const [p,n,v] of undo)p.fa[n]-=v;}})(fxCross);
/* ---------- taktik kütüphanesi ---------- */
function tlib(){const m=G.m;m.tlib=m.tlib||[];return m.tlib;}
ACTX.tlSave=()=>{const m=fmInit(),L=tlib();const nm=(($('#tlName')||{}).value||'').trim()||`Taktik ${L.length+1}`;const t={n:nm.slice(0,24),fm:JSON.parse(JSON.stringify({f:m.fm.f,roles:m.fm.roles,ti:m.fm.ti})),tac:m.tac};const i=L.findIndex(x=>x.n===t.n);if(i>=0)L[i]=t;else{if(L.length>=6)return toast('En fazla 6 taktik kaydedebilirsin');L.push(t);}save();render();toast(`“${t.n}” kaydedildi`);};
ACTX.tlLoad=el=>{const t=tlib()[+el.dataset.i];if(!t)return;const m=fmInit();m.fm.f=t.fm.f;m.fm.roles=JSON.parse(JSON.stringify(t.fm.roles));m.fm.ti=Object.assign({},t.fm.ti);if(t.tac)m.tac=t.tac;m.xi=null;m.fm.fam=Math.max(30,(m.fm.fam||50)-4);save();render();toast(`“${t.n}” yüklendi`);};
ACTX.tlDel=el=>{tlib().splice(+el.dataset.i,1);save();render();};
function tlibHTML(){const L=tlib();return `<section class="panel tlib"><p class="sub-h"><span>Taktik kütüphanesi</span><span>${L.length}/6</span></p>
  ${L.length?`<ul class="tl-l">${L.map((t,i)=>`<li><b>${esc(t.n)}</b><small>${t.fm.f} · ${TAC[t.tac]?TAC[t.tac].n:''}</small><button class="btn sm" data-act="tlLoad" data-i="${i}">Yükle</button><button class="btn sm ghost" data-act="tlDel" data-i="${i}">Sil</button></li>`).join('')}</ul>`:'<p class="muted">Henüz kayıtlı taktik yok. Örneğin bir “Önde basan 4-3-3” ve bir “Skoru koru 5-4-1” kaydet; maç sırasında Diziliş sekmesinden tek dokunuşla geçebilirsin.</p>'}
  <div class="tl-new"><input id="tlName" maxlength="24" placeholder="Taktik adı (ör. Hücum 4-3-3)"><button class="cta sm" data-act="tlSave">Mevcut taktiği kaydet</button></div></section>`;}
tacView=(old=>function(){const h=old.apply(this,arguments);try{if(G.mode==='mgr')return h+tlibHTML();}catch(e){}return h;})(tacView);
fxBodyUI=(old=>function(){const r=old.apply(this,arguments);try{const S=FX;if(S&&S.tab==='dz'&&G.mode==='mgr'&&tlib().length){const el=document.getElementById('fxBody');if(el&&!el.querySelector('.fx-tl'))el.insertAdjacentHTML('afterbegin',`<p class="fx-sub">Taktik kütüphanesi</p><div class="seg2 wrap fx-tl">${tlib().map((t,i)=>`<button class="chip" data-fx="tlib" data-k="${i}">${esc(t.n)}</button>`).join('')}</div>`);}}catch(e){console.warn(e);}return r;})(fxBodyUI);
fxAct=(old=>function(a,k,v){if(a==='tlib'&&FX){const t=tlib()[+k];if(t){const U=FX.U;if(FMF[t.fm.f]&&t.fm.f!==U.form)fxFormation(t.fm.f);for(const p of fxOn(U)){const r=t.fm.roles[p.slot];if(r&&(FMR[p.kind]||[]).some(x=>x[0]===r.r)){p.role=r.r;p.duty=r.d||'des';}}const dti={};for(const [k,v] of Object.entries(t.fm.ti||{}))if(U.ti[k]!==v)dti[k]=v;if(Object.keys(dti).length||t.tac!==U.tacK)fxSetTi(dti,t.tac!==U.tacK?t.tac:null);fxEv(fxMin(),`Taktik değişikliği: “${t.n}”.`,'tac');fxUI();}return;}return old.apply(this,arguments);})(fxAct);
/* ---------- maç hazırlığı ekranına paneller ---------- */
function oiHTML(){const opp=oiOpp();if(!opp)return '';const O=oiGet(opp.id),P=oiProf(opp.id),M=oiMods(opp),sq=squadOf(opp.id).sort((a,b)=>b.ovr-a.ovr);
  const opt=(list,cur)=>`<option value="">Yok</option>${list.map(p=>`<option value="${p.k}" ${cur===p.k?'selected':''}>${esc(p.name)} · ${dpTag(p)} · ${R200(p.ovr)}</option>`).join('')}`;
  return `<section class="panel oi"><p class="sub-h"><span>Rakibe özel talimatlar</span><span>${esc(opp.short)}</span></p>
   <div class="sp-row"><span>Yakın markaj</span><select data-chg2="oiSet" data-f="mark">${opt(sq.filter(p=>p.pos!=='KL').slice(0,12),O.mark)}</select></div>
   <div class="sp-row"><span>Üstüne git</span><select data-chg2="oiSet" data-f="weak">${opt(sq.filter(p=>p.pos==='DF').slice(0,6),O.weak)}</select></div>
   <div class="sp-row"><span>Pres</span><select data-chg2="oiSet" data-f="press">${[['nor','Normal'],['yuksek','Önde yoğun pres'],['dus','Derin blok']].map(([k,l])=>`<option value="${k}" ${O.press===k?'selected':''}>${l}</option>`).join('')}</select></div>
   <p class="muted oi-n">Analiz: yıldızı <b>${P.star?esc(P.star.name):'—'}</b> (${R200(P.star?P.star.ovr:'-')}), en zayıf savunmacısı <b>${P.weak?esc(P.weak.name):'—'}</b> (${R200(P.weak?P.weak.ovr:'-')}). Pas kalitesi ${Math.round(P.pas)}, hız ${Math.round(P.hiz)}${P.pas<68?' → önde pres işe yarayabilir':''}${P.hiz>74?' → derin blok arkaya koşuları keser':''}.</p>
   <p class="oi-e">Beklenen etki: hücum ${M.u>=1?'+':''}${Math.round((M.u-1)*100)}% · yenen gol ${M.o<=1?'':'+'}${Math.round((M.o-1)*100)}%</p></section>`;}
function sprHTML(){const s=sprGet(),F=sprFit(),fit=v=>v>0.5?'<em class="pill good">uygun</em>':v<-0.2?'<em class="pill red">zayıf</em>':'<em class="pill">orta</em>';
  return `<section class="panel spr"><p class="sub-h"><span>Duran top rutinleri</span><span>Antrenman seviyesi ${Math.round(G.m.sp!=null?G.m.sp:50)}</span></p><p class="muted" style="margin:0 0 4px">Hücum kornerleri</p>
  <div class="seg">${Object.entries(SPR_CK).map(([k,[n,d]])=>`<button class="chip" data-act="sprSet" data-g="ck" data-k="${k}" aria-pressed="${s.ck===k}">${n} ${fit(F.ck[k]||0)}<small>${d}</small></button>`).join('')}</div>
  <p class="muted" style="margin:8px 0 4px">Korner savunması</p><div class="seg" style="grid-template-columns:repeat(2,1fr)">${Object.entries(SPR_DF).map(([k,[n,d]])=>`<button class="chip" data-act="sprSet" data-g="df" data-k="${k}" aria-pressed="${s.df===k}">${n} ${fit(F.df[k]||0)}<small>${d}</small></button>`).join('')}</div></section>`;}
ACTX.sprSet=el=>{sprGet()[el.dataset.g]=el.dataset.k;save();render();};
document.addEventListener('change',e=>{const el=e.target.closest&&e.target.closest('[data-chg2]');if(!el)return;if(el.dataset.chg2==='oiSet'){const opp=oiOpp();if(!opp)return;oiGet(opp.id)[el.dataset.f]=el.value||(el.dataset.f==='press'?'nor':'');save();render();}});
viewPrep=(old=>function(){const h=old.apply(this,arguments);try{if(G.mode==='mgr')return h+`<div class="tr-grid">${oiHTML()}${sprHTML()}</div>`;}catch(e){console.warn(e);}return h;})(viewPrep);
if(XV.prep)XV.prep=()=>viewPrep();

/* ---------- kulüp kültürü ---------- */
const CULT={sampiyon:['Kazanma kültürü','Her maç kazanılmalı; beraberlik bile eleştirilir.'],hucum:['Hücum futbolu','Taraftar atak futbol ve bol gol ister.'],genc:['Gençlere güven','23 yaş altı oyuncuların ilk 11’de oynaması beklenir.'],altyapi:['Altyapıdan gelenler','Gençlere süre ve gelişim önceliklidir.'],vitrin:['Oyuncu değerlendirme','Gençleri vitrine çıkarıp değerli satışlar yapmak.'],savunma:['Disiplinli savunma','Az gol yiyen, kompakt bir takım.'],tutumlu:['Mali disiplin','Maaş bütçesini aşmadan sonuç almak.']};
function cultOf(c){c=c||myClub();const v=clubVision(c),L=LEAGUES[c.league],cc=(L&&L.cc)||'TR',out=[v];if(cc==='TR'&&c.str>=78)out.push('yerli');return out;}
const CULT_X={yerli:['Yerli oyuncu','Taraftar ilk 11’de Türk oyuncular görmek ister.']};
function cultEval(gu,go,win,draw){const m=G.m,sq=squadOf(G.club),xi=mgrXI().map(k=>sq.find(p=>p.k===k)).filter(Boolean),res=[];
  for(const k of cultOf()){let v=0;
    if(k==='sampiyon')v=win?1:draw?-0.6:-1;else if(k==='hucum')v=(gu>=2?0.8:gu===0?-0.8:0)+(m.tac==='hucum'||m.tac==='pres'?0.4:m.tac==='savunma'?-0.6:0);
    else if(k==='genc'||k==='altyapi'||k==='vitrin'){const n=xi.filter(p=>p.age<=23).length;v=n>=3?1:n>=2?0.4:-0.7;}else if(k==='savunma')v=go===0?1:go===1?0.3:-0.8;
    else if(k==='tutumlu'){const wb=typeof wageBill==='function'?wageBill():0,bud=m.wbud||0;v=bud&&wb>bud*1.02?-0.8:0.4;}else if(k==='yerli'){const n=xi.filter(p=>p.nat==='TUR').length;v=n>=5?0.8:n>=3?0.1:-0.8;}
    res.push(v);}
  const avg=res.reduce((a,b)=>a+b,0)/Math.max(1,res.length);m.cul=clamp((m.cul!=null?m.cul:60)+avg*3,0,100);m.conf=clamp(m.conf+avg*0.8,0,100);
  if(m.cul<30&&Math.random()<0.2)msg('board','Kulüp kültürü uyarısı',`Yönetim: “${myClub().name} kimliğine uygun oynamıyoruz. ${cultOf().map(k=>(CULT[k]||CULT_X[k])[0]).join(', ')} bu kulübün olmazsa olmazı.”`);}
mgrFinish=(old=>function(gu,go,f,scorers){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m)cultEval(gu,go,gu>go,gu===go);}catch(e){console.warn(e);}return r;})(mgrFinish);
/* ---------- yönetim kurulu seçimleri ---------- */
const PRES_N=['Mehmet Kaya','Ahmet Yıldırım','Hasan Çelik','Murat Aydın','Ali Rıza Demir','Burak Şahin','Cem Arslan','Erdem Koç','Levent Özkan','Tolga Erdoğan'];
function elInit(){const m=G.m;m.el=m.el||{last:G.s.year-rint(0,2),pres:pick(PRES_N)};return m.el;}
function elWeek(){const m=G.m,E=elInit();if(G.phase!=='season')return;
  if(!E.cur&&G.s.year-E.last>=3&&G.s.week>=Math.round(NR()*0.55)){const ch=pick(PRES_N.filter(n=>n!==E.pres)),keep=m.conf>=45&&Math.random()<0.6;
    E.cur={at:absDay()+28,ch,inc:E.pres,keep,sup:null};msg('board','Kulüpte seçim heyecanı',`${myClub().name} olağan genel kurulu 4 hafta sonra. Mevcut başkan ${E.pres} yeniden aday. Rakip aday ${ch}: “${keep?'Teknik direktörümüzle devam edeceğiz ama kadroya yatırım şart.':`Kazanırsam ${G.m.role==='sd'?'sportif direktör':'teknik direktör'} dahil her şey değişecek!`}” Yönetim sayfasından tavır alabilirsin.`);}
  const C=E.cur;if(C&&absDay()>=C.at){const pos=G.s.results.length?tablePos():10,n=leagueClubs(G.s.league).length,fans=m.fans!=null?m.fans:55;
    const pInc=clamp(0.5+(fans-55)/120+(n/2-pos)/(n*1.5)+(m.conf-50)/250,0.12,0.88),incWin=Math.random()<pInc,win=incWin?C.inc:C.ch;E.last=G.s.year;E.cur=null;E.pres=win;
    let t=`Genel kurulda ${win} başkan seçildi (${incWin?'mevcut yönetim devam':'yönetim değişti'}).`;
    if(C.sup){const ok=(C.sup==='inc')===incWin;if(ok){m.conf=clamp(m.conf+15,0,100);m.budget=Math.round((m.budget||0)*1.1);t+=' Desteklediğin aday kazandı: güven arttı, bütçeye ek kaynak geldi.';}else{m.conf=clamp(m.conf-25,0,100);t+=' Desteklediğin aday kaybetti; yeni yönetim sana mesafeli.';}}
    else if(!incWin&&!C.keep){m.conf=clamp(Math.min(m.conf,45)-10,0,100);t+=' Yeni yönetim teknik direktör değişikliğini konuşuyor.';}
    msg('board','Seçim sonucu',t);if(m.conf<20&&G.phase==='season'){msg('board','Yeni yönetimden karar','Yeni yönetim kurulu teknik direktörle yollarını ayırma kararı aldı.');mgrSacked();}}}
ACTX.elSup=el=>{const C=G.m.el&&G.m.el.cur;if(!C)return;C.sup=el.dataset.k||null;if(C.sup){const fanR=Math.random();if(fanR<0.3){G.m.conf=clamp(G.m.conf+(C.sup==='inc'?3:-5),0,100);}}save();render();toast(C.sup?'Tavrını açıkladın':'Tarafsız kalıyorsun');};
function elHTML(){const E=elInit(),C=E.cur;return `<section class="panel el"><p class="sub-h"><span>Başkan ve seçim</span><span>Başkan: ${esc(E.pres)}</span></p>
  ${C?`<p>Genel kurula ${Math.max(0,C.at-absDay())} gün var. Rakip aday <b>${esc(C.ch)}</b> ${C.keep?'seninle devam edeceğini söylüyor':'kazanırsa teknik direktörü değiştirmeyi vaat ediyor'}.</p><div class="seg">${[['inc',`${C.inc}’i destekle`],['ch',`${C.ch}’i destekle`],['','Tarafsız kal']].map(([k,l])=>`<button class="chip" data-act="elSup" data-k="${k}" aria-pressed="${(C.sup||'')===k}">${esc(l)}</button>`).join('')}</div><p class="muted">Kazanan adayı desteklersen güven ve bütçe artar; kaybedeni desteklersen yeni yönetim sana sırt çevirir.</p>`
  :`<p class="muted">Son seçim ${E.last}. Bir sonraki olağan genel kurul ${E.last+3} sezonunda. Sonuçlar, taraftar memnuniyeti ve lig sırası seçimi etkiler.</p>`}</section>`;}
function cultHTML(){const m=G.m,cul=m.cul!=null?m.cul:60;return `<section class="panel cult"><p class="sub-h"><span>Kulüp kültürü</span><span>Uyum ${Math.round(cul)}</span></p><ul class="cult-l">${cultOf().map(k=>{const C=CULT[k]||CULT_X[k];return `<li><b>${C[0]}</b><small>${C[1]}</small></li>`;}).join('')}</ul><div class="bar"><i class="${cul>=60?'':cul>=40?'mid':'low'}" style="width:${cul}%"></i></div><p class="muted">Her lig maçından sonra yönetim, oyun anlayışının kulüp kimliğine uyup uymadığına bakar. Uyum düşerse güven azalır.</p></section>`;}
viewMgrBoard=(old=>function(){const h=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m)return h+`<div class="tr-grid">${cultHTML()}${elHTML()}</div>`;}catch(e){console.warn(e);}return h;})(viewMgrBoard);
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&G.m&&G.s&&G.phase==='season'){const wk=Math.floor(absDay()/7);if(G.m.elWk!==wk){G.m.elWk=wk;elWeek();}}}catch(e){console.warn(e);}return out;})(nextDay);

