/* ================= v24: FM tarzı oyuncu profili (1-20 özellikler, pozisyonlar, karakteristikler) ================= */
const FMP_T=['Bitiricilik','Dripling','İlk Kontrol','Kafa Vuruşu','Korner','Markaj','Orta Yapma','Pas','Penaltı Kullanma','Serbest Vuruş Kullanma','Teknik','Top Kapma','Uzaktan Şut','Uzun Taç'];
const FMP_M=['Agresiflik','Cesaret','Çalışkanlık','Karar Alma','Kararlılık','Konsantrasyon','Liderlik','Önsezi','Özel Yetenek','Pozisyon Alma','Soğukkanlılık','Takım Oyunu','Topsuz Alan','Vizyon'];
const FMP_P=['Çeviklik','Dayanıklılık','Denge','Güç','Hız','Hızlanma','Vücut Zindeliği','Zıplama'];
const FMP_G=['Ayakla Oyun','Bire Bir','Eksantriklik','Elle Oyun','Hava Hakimiyeti','İletişim','İlk Kontrol','Kaleden Çıkma','Pas','Refleks','Topu Oyuna Sokma','Uzun Atış','Yumruklama'];
const to20=v=>clamp(Math.round((v-16)/4.1),1,20);
function fmAttrs(p){const X={};for(const [,a] of pAttrsX(p))for(const [n,v] of a)X[n]=v;const r=srng(p.k+'fm20');r();r();const j=(v,s=5)=>clamp(v+r()*s*2-s,10,99),o=p.ovr,gk=p.pos==='KL';
  const pick=(...ks)=>{for(const k of ks)if(X[k]!=null)return X[k];return o-10;};
  const T={'Bitiricilik':gk?j(30,10):pick('Bitiricilik'),'Dripling':gk?j(35,10):pick('Top sürme'),'İlk Kontrol':gk?j(o-18,8):pick('İlk dokunuş'),'Kafa Vuruşu':gk?j(30,10):pick('Kafa vuruşu'),
    'Korner':gk?j(25,8):j((pick('Orta')+pick('Serbest vuruş'))/2-2,7),'Markaj':gk?j(30,8):pick('Markaj'),'Orta Yapma':gk?j(28,8):pick('Orta'),'Pas':gk?j(o-16,8):pick('Pas'),
    'Penaltı Kullanma':gk?j(35,10):pick('Penaltı'),'Serbest Vuruş Kullanma':gk?j(30,10):pick('Serbest vuruş'),'Teknik':gk?j(o-18,8):pick('Teknik'),'Top Kapma':gk?j(30,8):pick('Top kapma'),
    'Uzaktan Şut':gk?j(28,10):pick('Uzaktan şut'),'Uzun Taç':j(p.pos==='DF'?o-22:o-38,14)};
  const M={'Agresiflik':pick('Agresiflik'),'Cesaret':j(o-6+(p.pos==='DF'?6:0),9),'Çalışkanlık':pick('Çalışkanlık'),'Karar Alma':pick('Karar alma'),'Kararlılık':pick('Kararlılık'),
    'Konsantrasyon':gk?pick('Konsantrasyon'):j(o-5,8),'Liderlik':pick('Liderlik'),'Önsezi':pick('Önsezi'),'Özel Yetenek':gk?j(o-25,10):j((pick('Top sürme')+pick('Teknik'))/2-4,9),'Pozisyon Alma':pick('Pozisyon alma'),
    'Soğukkanlılık':pick('Soğukkanlılık'),'Takım Oyunu':pick('Takım oyunu'),'Topsuz Alan':gk?j(25,8):pick('Topsuz oyun'),'Vizyon':gk?j(o-20,10):pick('Vizyon')};
  const P={'Çeviklik':pick('Çeviklik'),'Dayanıklılık':pick('Dayanıklılık'),'Denge':pick('Denge'),'Güç':pick('Güç'),'Hız':pick('Hız'),'Hızlanma':pick('Hızlanma'),'Vücut Zindeliği':pick('Doğal kondisyon'),'Zıplama':pick('Zıplama')};
  const Gk=gk?{'Ayakla Oyun':pick('Ayakla oyun'),'Bire Bir':pick('Bire bir'),'Eksantriklik':j(40,20),'Elle Oyun':pick('Elle oyun'),'Hava Hakimiyeti':pick('Hava hakimiyeti'),'İletişim':pick('İletişim'),'İlk Kontrol':j(o-14,8),
    'Kaleden Çıkma':pick('Çıkışlar'),'Pas':j(o-12,8),'Refleks':pick('Refleks'),'Topu Oyuna Sokma':j(pick('Uzun atış')-2,6),'Uzun Atış':pick('Uzun atış'),'Yumruklama':j(o-15,12)}:null;
  const f=(L,src)=>L.map(n=>[n,to20(src[n])]);
  return {gk,T:f(FMP_T,T),M:f(FMP_M,M),P:f(FMP_P,P),G:Gk?f(FMP_G,Gk):null,raw:Object.assign({},T,M,P,Gk||{})};}
const FMP_PERS={Profesyonel:'Profesyonel',Sakin:'Dengeli',Lider:'Örnek Teşkil Eden','Hırslı':'Hırslı',Hassas:'Duygusal',Asi:'Huysuz'};
function fmPPM(p,A){const v=n=>to20(A.raw[n]||0),L=[];const add=(c,t,w)=>{if(c)L.push([w,t]);};const fw=p.pos==='FW',kn=p.pos==='KN',df=p.pos==='DF',os=p.pos==='OS';
  if(A.gk){add(v('Ayakla Oyun')>=14,'Topu kısa oynar',v('Ayakla Oyun'));add(v('Kaleden Çıkma')>=14,'Kalesinden sık çıkar',v('Kaleden Çıkma'));add(v('Yumruklama')>=14,'Topu yumruklamayı tercih eder',v('Yumruklama'));add(v('Uzun Atış')>=15,'Uzun atışla hızlı hücum başlatır',v('Uzun Atış'));add(v('Eksantriklik')>=15,'Riskli çıkışlar yapar',v('Eksantriklik'));}
  else{add(v('Topsuz Alan')>=15&&(fw||kn||os),'Boş alanlara koşu yapar',v('Topsuz Alan'));add(v('Bitiricilik')>=14&&(fw||kn||os),'Toplara plase vurur',v('Bitiricilik'));add(v('Uzaktan Şut')>=15,'Uzaktan şut dener',v('Uzaktan Şut'));
    add(v('Dripling')>=16,'Rakibini çalımla geçmeye çalışır',v('Dripling'));add(v('Vizyon')>=16,'Ara pası dener',v('Vizyon'));add(v('Orta Yapma')>=15&&(df||kn),'Çizgiye inip orta yapar',v('Orta Yapma'));add(v('Kafa Vuruşu')>=15,'Hava toplarında etkilidir',v('Kafa Vuruşu'));
    add(v('Agresiflik')>=15,'Hakemlere sık sık itiraz eder',v('Agresiflik'));add(v('Top Kapma')>=15&&df,'Kayarak müdahaleyi sever',v('Top Kapma'));add(v('Pas')>=15&&df,'Geriden oyun kurar',v('Pas'));add(v('Liderlik')>=15,'Takım arkadaşlarını yönlendirir',v('Liderlik'));
    add(v('Serbest Vuruş Kullanma')>=15,'Serbest vuruşlarda iddialıdır',v('Serbest Vuruş Kullanma'));add(v('Özel Yetenek')>=16,'Topuk ve rabona gibi şık hareketler dener',v('Özel Yetenek'));add(v('Hız')>=17&&(kn||fw),'Savunma arkasına koşmayı sever',v('Hız'));}
  return L.sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>x[1]);}
const FMP_POS={GK:[50,92],DL:[13,74],DC:[50,76],DR:[87,74],WBL:[10,57],DM:[50,60],WBR:[90,57],ML:[13,42],MC:[50,44],MR:[87,42],AML:[15,24],AMC:[50,27],AMR:[85,24],ST:[50,9]};
const FMP_PN={GK:'Kaleci',DL:'Sol bek',DC:'Stoper',DR:'Sağ bek',WBL:'Sol kanat bek',DM:'Ön libero',WBR:'Sağ kanat bek',ML:'Sol orta saha',MC:'Merkez orta saha',MR:'Sağ orta saha',AML:'Sol kanat',AMC:'Ofansif orta saha',AMR:'Sağ kanat',ST:'Santrfor'};
function fmPosR(p){const r=srng(p.k+'posr');r();r();const R={},s=()=>r()<0.5?'L':'R',J=(a,b)=>a+Math.floor(r()*(b-a+1));for(const k in FMP_POS)R[k]=1;
  if(p.pos==='KL'){R.GK=20;}
  else if(p.pos==='DF'){if(r()<0.42){const S=s(),O=S==='L'?'R':'L';R['D'+S]=20;R['WB'+S]=J(15,18);R['D'+O]=J(8,13);R.DC=J(9,14);R['M'+S]=J(6,11);}else{R.DC=20;R.DM=J(7,13);R.DL=J(5,12);R.DR=J(5,12);}}
  else if(p.pos==='OS'){const t=r();if(t<0.33){R.DM=20;R.MC=J(16,18);R.DC=J(6,12);}else if(t<0.66){R.MC=20;R.DM=J(13,17);R.AMC=J(13,17);}else{R.AMC=20;R.MC=J(15,18);R.AMR=J(8,15);R.AML=J(8,15);R.ST=J(6,12);}}
  else if(p.pos==='KN'){const S=s(),O=S==='L'?'R':'L';R['AM'+S]=20;R['AM'+O]=J(13,18);R['M'+S]=J(14,17);R.AMC=J(8,14);R.ST=J(6,13);R['WB'+S]=J(5,10);}
  else{R.ST=20;R.AMC=J(7,13);R.AML=J(5,12);R.AMR=J(5,12);}
  return R;}
function fmBirth(p){const r=srng(p.k+'dob');r();const d=1+Math.floor(r()*28),m=1+Math.floor(r()*12),Y=(G&&G.s?G.s.year:2026),by=Y-p.age-(m>7?1:0);return `${d}/${m}/${by}`;}
function fmCaps(p){const r=srng(p.k+'caps');r();if(p.ovr<70||p.age<19)return null;const c=Math.round(Math.max(0,p.age-19)*(p.ovr-68)*(0.45+r()*0.5)),gr={FW:0.38,KN:0.24,OS:0.12,DF:0.04,KL:0}[p.pos];return c?[c,Math.round(c*gr*(0.5+r()))]:null;}
const fmStars=v=>{const w=clamp(v,0,5)/5*100;return `<span class="fm-st"><i style="width:${w}%">★★★★★</i>★★★★★</span>`;};
function fmProfHTML(p,c,opt){opt=opt||{};const A=fmAttrs(p),M=pMetaX(p),sc=!opt.acad&&scOn&&scOn(c),acc=sc?scAcc(p):5,mine=c.id===G.club,mgr=G.mode==='mgr',R=opt.acad?'Akademi':squadRoles(c.id)[p.k];
  const w20=[20,7,5,3,2,0][acc],cls=v=>v>=16?'v5':v>=11?'v4':v>=6?'v3':'v1';
  const cell=(n,v,i)=>{let s=v;if(sc&&acc<5){if(acc<=1)s='–';else{const off=Math.floor(srng(p.k+n+acc)()*(w20+1));s=w20?`${Math.max(1,v-off)}-${Math.min(20,v-off+w20)}`:v;}}return `<div class="fmr"><span>${n}</span><b class="${typeof s==='number'?cls(s):'vr'}">${s}</b></div>`;};
  const col=(t,L)=>`<div class="fmc"><p class="fmh">${t}</p>${L.map(([n,v],i)=>cell(n,v,i)).join('')}</div>`;
  const wt=M.h-105+Math.round(srng(p.k+'wt')()*12-4),foot=(side)=>{const main=M.ft==='İki ayak'||(side==='SOL'?M.ft==='Sol':M.ft==='Sağ');const lv=main?5:M.wf;return [['Çok Zayıf','Zayıf','Orta','Kuvvetli','Çok Kuvvetli'][lv-1],lv];};
  const fl=foot('SOL'),fr=foot('SAĞ'),fc=lv=>lv>=4?'#35c45a':lv>=3?'#e08a2a':'#c23b4a';
  const pers=FMP_PERS[persOf(p)]||persOf(p),pr=fmPosR(p),best=Object.entries(pr).sort((a,b)=>b[1]-a[1])[0][0];
  const adj=p.ovr>=88?'Efsanevi':p.ovr>=84?'Dünya çapında':p.ovr>=79?'Saygın':p.ovr>=73?'Güvenilir':p.ovr>=66?'Sağlam':'Gelişmekte olan',young=p.age<=21&&potOf(p)>=80;
  const media=young?`Geleceğin yıldızı ${FMP_PN[best].toLowerCase()}`:`${adj} ${(best==='AMC'?'ofansif orta saha':best==='DC'?'stoper':best==='GK'?'kaleci':best==='ST'?'forvet':FMP_PN[best].toLowerCase())}`;
  const mm=['Soğukkanlı','İhtiyatlı','Açık sözlü','Medya dostu','Kısa ve öz','Sinirli'][to20(A.raw['Agresiflik'])>=15?5:Math.floor(srng(p.k+'mm')()*5)];
  const tier=LEAGUES[c.league]?LEAGUES[c.league].tier:7,rep=Math.round(clamp((p.ovr-55)/6.5+(tier-8)*0.35,0.5,5)*2)/2;
  const caps=fmCaps(p),R2=opt.acad?null:R,wage=opt.acad?0:pWage(p,c.id),end=opt.acad?null:ctEnd(p),pv=pValue(p);
  const pp=pPot(p),potU=sc&&acc<3||(!mine&&mgr&&pp[1]-pp[0]>6),cur=clamp((p.ovr-45)/9,0.5,5),pot=clamp(((pp[0]+pp[1])/2-45)/9,0.5,5);
  let extra='';if(mgr&&!opt.acad){if(mine)extra=`<div class="fmi"><span>Moral</span><b>${moodOf(relOf(p))[2]} ${moodOf(relOf(p))[1]}</b></div>`;else{try{const Aq=askPrice(p,c.id);extra=`<div class="fmi"><span>İstenen bedel</span><b>${Aq.nfs?'Satılık değil':`${eur(rnd5(Aq.a*0.9,stepOf(Aq.a)))} – ${eur(rnd5(Aq.a*1.15,stepOf(Aq.a)))}`}</b></div>`;}catch(_){}}}
  const posMap=`<div class="fmpos"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="1" y="1" width="98" height="98" rx="2" fill="#2f7d38" stroke="rgba(255,255,255,.45)"/><line x1="1" y1="50" x2="99" y2="50" stroke="rgba(255,255,255,.4)"/><rect x="28" y="84" width="44" height="15" fill="none" stroke="rgba(255,255,255,.4)"/><rect x="28" y="1" width="44" height="15" fill="none" stroke="rgba(255,255,255,.4)"/></svg>
    ${(()=>{const rk=Object.keys(FMP_POS).filter(k=>pr[k]>=11).sort((a,b)=>pr[b]-pr[a]);return Object.entries(FMP_POS).map(([k,[x,y]])=>{const v=pr[k],ri=rk.indexOf(k),c2=['p6','p5','p3','p2','p1'][ri]||'p0';return `<span class="fmpd ${c2}" style="left:${x}%;top:${y}%" title="${FMP_PN[k]} · ${v>=18?'Doğal':v>=15?'Usta':v>=11?'Yetkin':v>=6?'Beceriksiz':'Uygun değil'}">${k}</span>`;}).join('');})()}</div>
    <div class="fmpos-l"><span><i class="p6"></i>Ana mevki</span><span><i class="p5"></i>İkincil</span><span><i class="p3"></i>Üçüncül</span><span><i class="p2"></i>4.</span><span><i class="p1"></i>5.</span></div>
    <p class="fmh" style="margin-top:8px">En uygun roller</p><div class="fp-roles">${bestRoles(p).map(([n,v])=>`<span>${esc(n)} <em>${'★'.repeat(fitStars(v))||'☆'}</em></span>`).join('')}</div>`;
  const prof=`<div class="fmi"><span>Yaş</span><b>${p.age} yaşında (${fmBirth(p)})</b></div>
    <div class="fmi"><span>Uyruk</span><b>${flagImg(p.nat,'fl-row')} ${esc(natName(p.nat))}<small>${caps?`${caps[0]} maç / ${caps[1]} gol`:'Milli maçı yok'}</small></b></div>
    ${opt.acad?`<div class="fmi"><span>Durum</span><b>${esc(c.name)} akademisi<small>Profesyonel sözleşmesi yok</small></b></div>`:`<div class="fmi"><span>Sözleşme</span><b>${esc(c.name)} ile sözleşmesi var<small>30/6/${end} tarihine kadar ${wgT(wage)}${wgIsEst(p,c.id)?wgEstTag(c.league):''}</small><small>${esc(R2||'Kadro oyuncusu')}</small></b></div>`}
    <div class="fmi"><span>Piyasa Değeri</span><b><em class="fm-mv">${eur(rnd5(pv*0.93,stepOf(pv)))} – ${eur(rnd5(pv*1.07,stepOf(pv)))}</em></b></div>${extra}
    <div class="fmi two"><div><span>M.Y.</span><b title="Mevcut yetenek">${sc&&acc<2?'Bilinmiyor':fmStars(cur)}</b></div><div><span>P.Y.</span><b title="Potansiyel yetenek">${potU?'Bilinmiyor':fmStars(pot)}</b></div></div>`;
  const unk=sc&&acc<=1;const right=unk?`<div class="fmc fmx"><p class="fmh">Kişilik</p><p>Bilinmiyor</p><p class="fmh">Medya gözünde</p><p>${esc(media)}</p><p class="fmh">Medya yönetimi</p><p>Bilinmiyor</p><p class="fmh">İtibar</p><p>${fmStars(rep)}</p><p class="fmh">Oyun karakteristikleri</p><p class="ppm muted">Oyuncuyu daha çok izlemelisin</p></div>`:`<div class="fmc fmx"><p class="fmh">Kişilik</p><p>${esc(pers)}</p><p class="fmh">Medya gözünde</p><p>${esc(media)}</p><p class="fmh">Medya yönetimi</p><p>${mm}</p><p class="fmh">İtibar</p><p>${fmStars(rep)}</p><p class="fmh">Oyun karakteristikleri</p>${(fmPPM(p,A).map(t=>`<p class="ppm">${t}</p>`).join(''))||'<p class="ppm muted">Belirgin bir alışkanlığı yok</p>'}</div>`;
  const phys=`<div class="fmc"><p class="fmh">Fiziksel</p>${A.P.map(([n,v],i)=>cell(n,v,i)).join('')}<div class="fm-body"><div class="fmr"><span>Boy</span><b class="vb">${M.h} cm</b></div><div class="fmr"><span>Ağırlık</span><b class="vb">${wt} kg</b></div></div>
    <div class="fm-feet"><div><span>SOL AYAK</span><b>${fl[0]}</b><i style="background:${fc(fl[1])}">👟</i></div><div><span>SAĞ AYAK</span><b>${fr[0]}</b><i style="background:${fc(fr[1])}">👟</i></div></div></div>`;
  const cols=A.gk?col('Kalecilik',A.G)+col('Zihinsel',A.M)+phys+right:col('Teknik',A.T)+col('Zihinsel',A.M)+phys+right;
  return `<section class="fmp" data-tab="pr"><div class="fmp-top"><div class="fmp-id"><div class="fmp-badges">${flagImg(p.nat,'fmp-flag')}<span class="fmp-crest">${opt.acad?'🎓':crestSVG(c,54)}</span></div><div class="fmp-photo">${faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num,capt:R==='Kaptan'})}</div><div class="fmp-name">${p.num?p.num+'. ':''}${esc(p.name).toLocaleUpperCase('tr-TR')}</div></div>
    <div class="fmp-info"><div class="fmp-tabs"><button data-act="fmpTab" data-k="pr" class="on">Profil</button><button data-act="fmpTab" data-k="po">Pozisyonlar</button><span class="fmp-ovr">${POS_TR[p.pos]} · Güç <b>${R200(sc&&acc<5?scO(p,c):p.ovr)}</b></span></div>
     <div class="fmp-pr">${prof}</div><div class="fmp-po">${posMap}</div></div></div>
   <p class="fmp-sec">Özellikler${sc&&acc<5?` <small>· gözlem bilgisi ${['çok az','az','orta','iyi','çok iyi'][acc]||''}, değerler aralık olarak tahmin</small>`:''}</p><div class="fmp-attr">${cols}</div></section>`;}
ACTX.fmpTab=el=>{const s=el.closest('.fmp');if(!s)return;s.dataset.tab=el.dataset.k;s.querySelectorAll('.fmp-tabs button').forEach(b=>b.classList.toggle('on',b===el));};
showPCard=(old=>function(id,k){old(id,k);const p=squadOf(id).find(x=>x.k===k),c=CLUBS[id],mc=$('#modalCard');if(!p||!c||!mc||$('#modal').hidden)return;
  const keep=[...mc.children].filter(e=>e.matches('.offer-btns')||(e.matches('p.muted')&&!e.closest('.fm-prof'))).map(e=>e.outerHTML).join('');
  mc.innerHTML=fmProfHTML(p,c)+keep;mc.classList.add('wide');mc.scrollTop=0;})(showPCard);
closeModal=(old=>function(){const mc=$('#modalCard');if(mc)mc.classList.remove('wide');return old();})(closeModal);
openModal=(old=>function(h){const mc=$('#modalCard');if(mc)mc.classList.remove('wide');return old(h);})(openModal);
ACTX.acadCard=el=>{const p=pByKey(el.dataset.k);if(!p)return;openModal(fmProfHTML(p,myClub(),{acad:true})+`<div class="offer-btns"><button class="cta sm" data-act="acadUpPM" data-k="${p.k}">A takıma al</button><button class="btn ghost" data-act="closeModal">Kapat</button></div>`);$('#modalCard').classList.add('wide');};
ACTX.acadUpPM=el=>{closeModal();ACTX.acadUpP(el);};

