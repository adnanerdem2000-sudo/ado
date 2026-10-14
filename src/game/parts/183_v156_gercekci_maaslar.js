/* ================= v156: gerçekçi maaşlar — tek maaş modeli =================
   Kaynaklar ve varsayımlar: src/game/MAAS_KAYNAKLARI.md
   - Lig ortalamaları: UEFA "European Club Finance and Investment Landscape 2025" (2024 mali yılı, kulüp başına ortalama
     oyuncu ücreti ÷ 30 kadro oyuncusu), Deloitte (Championship), MLSPA (MLS), Capology/haber (Suudi), FootyStats (Liga MX).
     Diğer ligler "tahmini" (kaynakta açık rakam yok; komşu liglere göre ölçeklendi).
   - Yapay zekâ oyuncuları: piyasa değerinden (yaşa göre düzeltilmiş) üstel bir eğriyle, ligin ortalaması tutacak şekilde
     ölçeklenir. Gerçek oyunculara tek tek gerçek maaş atanmaz; ekranda "tahmini" yazar.
   - Bizim futbolcu: U14/U16 amatör (ücret yok), U19 profesyonel ilk sözleşme ≈ asgari ücret (2026 brüt 33.030 ₺/ay),
     amatör liglerde yalnız masraf karşılığı, profesyonel liglerde kulübündeki benzer güçteki oyuncuların maaşına göre.
   İç birimler değişmedi: G.contract.wage = haftalık, iç birim (E2U); pWage = haftalık €. */
const WG_ASGARI=Math.round(33030*12/KUR.eur);/* 2026 brüt asgari ücret, yıllık € (≈7,2 bin €) */
/* a: oyuncu başı ortalama yıllık brüt €, b: yıldız/ortalama farkının sertliği (UEFA ligleri: medyan/ortalama kulüp ücret oranına uyduruldu), r: oyuncu maaşı/gelir oranı (UEFA), s: kaynak */
const WG_LG={
  pl:{a:5.83e6,b:1.1,r:.47,s:'u'},ll:{a:3.07e6,b:0.9,r:.47,s:'u'},de1:{a:2.9e6,b:0.65,r:.40,s:'u'},it1:{a:2.5e6,b:0.95,r:.51,s:'u'},fr1:{a:2.63e6,b:1.1,r:.56,s:'u'},
  sl:{a:8.7e5,b:0.75,r:.57,s:'u'},ru1:{a:7.7e5,b:0.9,r:.36,s:'u'},nl1:{a:5.7e5,b:0.9,r:.43,s:'u'},be1:{a:8.3e5,b:0.9,r:.70,s:'u'},pt1:{a:6e5,b:0.85,r:.51,s:'u'},
  sc1:{a:4e5,b:1.2,r:.37,s:'u'},ch1:{a:3.7e5,b:0.65,r:.38,s:'u'},at1:{a:2.9e5,b:0.8,r:.34,s:'u'},dk1:{a:2.6e5,b:0.85,r:.42,s:'u'},gr1:{a:4e5,b:0.85,r:.72,s:'u'},
  se1:{a:1.7e5,b:1.2,r:.34,s:'u'},po1:{a:1.7e5,b:1.0,r:.39,s:'u'},hr1:{a:2.1e5,b:1.2,r:.49,s:'u'},no1:{a:1.3e5,b:1.15,r:.34,s:'u'},
  sa1:{a:2.2e6,b:1.2,r:.8,s:'c'},us1:{a:5.6e5,b:1.05,r:.5,s:'m'},mx1:{a:3.4e5,b:.9,r:.55,s:'f'},en2:{a:1.45e6,b:.8,r:.93,s:'d'},
  es2:{a:4e5,b:.8,r:.6,s:'t'},de2:{a:5.5e5,b:.8,r:.5,s:'t'},it2:{a:3.5e5,b:.8,r:.7,s:'t'},fr2:{a:3e5,b:.8,r:.6,s:'t'},en3:{a:2.5e5,b:.8,r:.8,s:'t'},
  es3:{a:6e4,b:.7,r:.7,s:'t'},de3:{a:1.5e5,b:.7,r:.7,s:'t'},it3:{a:7e4,b:.7,r:.7,s:'t'},fr3:{a:5e4,b:.7,r:.7,s:'t'},
  br1:{a:5e5,b:1,r:.6,s:'t'},ar1:{a:2e5,b:1,r:.6,s:'t'},jp1:{a:2.5e5,b:.8,r:.5,s:'t'},cz1:{a:1.2e5,b:.8,r:.5,s:'t'},ua1:{a:1.5e5,b:.9,r:.5,s:'t'},rs1:{a:8e4,b:.9,r:.5,s:'t'},
  l1:{a:1.6e5,b:.9,r:.8,s:'t'},l2:{a:4.5e4,b:.7,r:.8,s:'t'},l3:{a:1.8e4,b:.6,r:.8,s:'t'}};
/* amatör ve altyapı: sabit kurallar */
const WG_AM={sal:1200,bal:2400};/* yıllık masraf karşılığı (yol, yemek), tahmini — amatör lisansta maaş olmaz */
function wgKey(lid){if(!lid)return 'sl';if(/^sal\d*$|^samx$/.test(lid))return 'sal';if(/^bal\d*$/.test(lid))return 'bal';if(lid==='l2b')return 'l2';if(/^l3[bc]?$|^trx$/.test(lid))return 'l3';return lid;}
function wgLg(lid){const k=wgKey(lid);if(WG_LG[k])return WG_LG[k];const L=LEAGUES[lid]||{};const a=[0,0,0,0,0,1.8e4,4.5e4,1.5e5,4e5,2.5e6][L.tier||7]||1.5e5;return {a,b:.85,r:.6,s:'t'};}
function wgMin(lid){const g=wgLg(lid),k=wgKey(lid);return Math.max(['sl','l1','l2','l3'].includes(k)?WG_ASGARI:3000,g.a*0.03);}
function wgAgeK(a){return a<=17?.3:a<=19?.5:a<=21?.7:a<=23?.88:1;}
function wgAbil(p){const mv=Math.max(1e4,pValue(p)),af=typeof pvAf==='function'?clamp(pvAf(p.age),0.6,1.5):1;return mv/af*wgAgeK(p.age);}/* yaşlı oyuncuda değer düşer ama maaş hemen düşmez: düzeltme 1/0,6 ile sınırlı */
const WG_C={};
function wgClubK(c){if(!c)return 1;const k='ck'+c.id;if(WG_C[k]!=null)return WG_C[k];const bs=leagueClubs(c.league).map(x=>clubBudget(x)).sort((a,b)=>a-b),med=bs[Math.floor(bs.length/2)]||1;
  return WG_C[k]=clamp(Math.pow(clubBudget(c)/med,0.2),0.75,1.5);}
/* ligin ölçek katsayısı: ligdeki tüm oyuncuların ortalaması tablo ortalamasına eşit olur (oturum başına bir kez) */
function wgCal(lid){const key=wgKey(lid),yr=G&&G.s?G.s.year:2026,ck='k'+key+yr;if(WG_C[ck]!=null)return WG_C[ck];const g=wgLg(lid);let s=0,n=0;
  for(const c of Object.values(CLUBS)){if(wgKey(c.league)!==key)continue;const ck2=wgClubK(c);for(const p of squadOf(c.id)){if(p.k==='ME')continue;s+=Math.pow(wgAbil(p),g.b)*ck2;n++;}}
  return WG_C[ck]=n?g.a/(s/n):1e-3;}
/* yapay zekâ oyuncusunun yıllık brüt maaşı (€, tahmini) */
function wgAnnual(p,cid){const c=CLUBS[cid];if(!c)return WG_ASGARI;const L=LEAGUES[c.league]||{},key=wgKey(c.league);
  const v=0.85+(hash(p.k+'w')%30)/100;
  if(L.youth)return c.league==='u19'?Math.round(WG_ASGARI*wgClubK(c)*v):0;
  if(WG_AM[key])return Math.round(WG_AM[key]*wgClubK(c)*v);
  const g=wgLg(c.league);return Math.max(wgMin(c.league),wgCal(c.league)*Math.pow(wgAbil(p),g.b)*wgClubK(c)*v);}
const wgStepE=w=>w>=1e5?1000:w>=1e4?500:w>=1000?50:10;
function wgWeekE(annual){const w=annual/52;return annual<=0?0:Math.max(10,Math.round(w/wgStepE(w))*wgStepE(w));}
const wgU=annual=>E2U(wgWeekE(annual));/* yıllık € → haftalık iç birim (G.contract.wage) */
/* eski pWage formülü (eski kayıtlardaki menajer-sözleşmelerini oranlamak için) */
function wgOldWeek(p,cid){const c=CLUBS[cid];return 900*Math.exp((p.ovr-60)/6.5)*lgWageF(c?c.league:'sl')*(0.85+(hash(p.k+'w')%30)/100);}
pWage=(old=>function(p,cid){cid=cid||scCidM(p);const m=G&&G.m;if(m&&m.ct&&m.ct[p.k]&&cid===G.club)return m.ct[p.k].w;
  try{if(!p||!p.k)return old.apply(this,arguments);return wgWeekE(wgAnnual(p,cid));}catch(e){return old.apply(this,arguments);}})(pWage);

/* ---------- bizim futbolcu ---------- */
const WG_ROLE={'Yıldız':1.25,'Kaptan':1.25,'İlk 11':1,'Rotasyon':.82,'Yedek':.7,'Gelişim':.6,'A Takıma Yükselme':.55,'Altyapı':.6};
function wgPeer(c,ovr){/* kulüpteki oyuncuların maaşı ~ güç: log-doğrusal uydurma */
  const pts=squadOf(c.id).filter(p=>p.k!=='ME').map(p=>[p.ovr,Math.log(Math.max(1,wgAnnual(p,c.id)))]);if(pts.length<4)return wgLg(c.league).a;
  const n=pts.length,mx=pts.reduce((a,x)=>a+x[0],0)/n,my=pts.reduce((a,x)=>a+x[1],0)/n;let sxy=0,sxx=0;for(const [x,y] of pts){sxy+=(x-mx)*(y-my);sxx+=(x-mx)*(x-mx);}
  const b=sxx?clamp(sxy/sxx,0.02,0.4):0.12,top=Math.max(...pts.map(x=>x[1]));return Math.exp(Math.min(my+b*(ovr-mx),top+Math.log(1.3)));}
function wgUserAnnual(c,role,age,m){if(!c)return 0;const L=LEAGUES[c.league]||{},key=wgKey(c.league);age=age||G.p.age;
  if(L.youth)return c.league==='u19'||age>=17?Math.round(WG_ASGARI*clamp(wgClubK(c),0.8,1.6)):0;
  if(WG_AM[key])return Math.round(WG_AM[key]*wgClubK(c)*(role==='Yıldız'?1.5:role==='İlk 11'?1.2:1));
  let w=wgPeer(c,OVR());
  const ageK=age<=17?.45:age<=18?.55:age<=20?.7:age<=22?.85:1;
  const avg=G.s&&G.s.stats&&G.s.stats.apps>=5?seasonAvg():0,perf=avg?clamp(1+(avg-6.8)*0.15,0.85,1.25):1;
  w*=(WG_ROLE[role]||1)*ageK*perf*(0.65+0.35*Math.min(1,(G.p.fame||0)/50))*(1+clamp(m||0,-5,15)*0.015);/* tanınmayan oyuncu, aynı güçteki yerleşik yıldızdan az kazanır */
  return Math.max(wgMin(c.league),w);}
const wgUserU=(c,role,age,m)=>wgU(wgUserAnnual(c,role,age,m));
/* teklifler: hesaplamayı yeni modele bağla; kulüp vizyonu, menajer ve ajans etkileri korunur */
makeOffer=(old=>function(c,m,kind,role,renew){const o=old.apply(this,arguments);try{if(!o||!isPl()||o.loan)return o;
    const age=G.p.age+(kind==='end'?1:0),L=LEAGUES[c.league]||{};let w=wgUserAnnual(c,o.role,age,m);
    w*=VIS_WAGE[clubVision(c)]||1;if(G.p.up&&G.p.up.menajer)w*=1.1;try{const a=agOf();if(a&&a.pow)w*=1+a.pow;}catch(e){}
    if(!L.youth&&!WG_AM[wgKey(c.league)])w=Math.max(w,wgMin(c.league));let u=wgU(w);if(renew&&G.contract&&G.contract.v156)u=Math.max(u,Math.round(G.contract.wage*1.06/50)*50);
    const f=o.wage>0?u/o.wage:0;o.wage=u;o.bonus=L.youth||!u?0:Math.round((o.bonus||0)*f/100)*100;o.v156=1;}catch(e){console.warn('v156 teklif',e);}return o;})(makeOffer);
acceptOffer=(old=>function(o){const r=old.apply(this,arguments);try{if(o&&o.status==='accepted'&&isPl()){for(const ct of [G.contract,G.next&&G.next.contract])if(ct&&!ct.v156&&ct.wage===o.wage&&(o.v156||o.loan))ct.v156=1;}}catch(e){}return r;})(acceptOffer);
/* seçmeler (U14): amatör lisans, ücret yok */
tryoutEnd=(old=>function(){const r=old.apply(this,arguments);try{const T=G&&G.tryout;if(T&&T.offers)for(const o of T.offers){o.wage=0;o.v156=1;}render();}catch(e){}return r;})(tryoutEnd);
signTryout=(old=>function(i){const r=old.apply(this,arguments);try{if(G.contract&&G.contract.wage===0)G.contract.v156=1;}catch(e){}return r;})(signTryout);
/* modele bağlı olmayan her sözleşmeyi (yeni kariyer, hızlı başlangıç, eski kayıt) bir kez yeniden hesapla */
function wgFix(){if(!G||!isPl()||!G.p||!G.s)return;const fix=(ct,cid,cur)=>{if(!ct||ct.v156||ct.loanKeep)return;const c=CLUBS[cid];if(!c)return;const old=ct.wage||0;
    ct.wage=wgUserU(c,ct.role,G.p.age,0);ct.v156=1;if(cur&&old>0&&!G.v156&&!G.wg156msg){G.wg156msg=1;
      msg('board','Maaşlar yeniden düzenlendi',`Oyundaki maaşlar gerçek lig ortalamalarına göre yeniden hesaplandı (v156). Sözleşmen ${money(old*52)} yerine yıllık ${money(ct.wage*52)} olarak güncellendi. Süre ve rolün değişmedi.`);}};
  fix(G.contract,G.club,true);if(G.next&&G.next.contract)fix(G.next.contract,G.next.club,false);if(G.loan&&G.loan.contract)fix(G.loan.contract,G.loan.parent,false);G.v156=1;}
/* yeni kariyerler baştan yeni modelle başlar (eski kayıt mesajı gösterilmez) */
newGame=(old=>function(){const r=old.apply(this,arguments);try{if(G)G.v156=1;}catch(e){}return r;})(newGame);
/* menajerlik: eski kayıtlarda kulübün sözleşmelerini yeni ölçeğe oranla taşı */
function wgFixMgr(){const m=G&&G.m;if(!m||G.mode!=='mgr'||m.v156||!G.club||!G.s||!squadOf(G.club).length)return;m.v156=1;try{if(m.ct)for(const k in m.ct){const p=pByKey(k);if(!p)continue;const ow=wgOldWeek(p,G.club),nw=wgWeekE(wgAnnual(p,G.club));m.ct[k].w=rnd5(nw*clamp(m.ct[k].w/Math.max(1,ow),0.6,1.6),10);}
  if(m.wbud){m.wbud=0;m.wbY=null;}/* maaş bütçesi wbudInit() ile yeni ölçekte yeniden hesaplanır */}catch(e){console.warn('v156 menajer',e);}}
render=(old=>function(){try{wgFix();wgFixMgr();}catch(e){console.warn('v156',e);}return old.apply(this,arguments);})(render);
nextDay=(old=>function(){try{wgFix();}catch(e){}return old.apply(this,arguments);})(nextDay);
/* orta/zirve başlangıç mesajındaki maaşı yeni değere çek */
wizGo=(old=>function(){const r=old.apply(this,arguments);try{if(G&&isPl()&&G.contract){wgFix();const im=(G.inbox||[]).find(x=>/Yıllık maaşın/.test(x.body||''));if(im)im.body=im.body.replace(/Yıllık maaşın [^.]*\./,`Yıllık maaşın ${money(G.contract.wage*52)}.`);save();render();}}catch(e){console.warn('v156 başlangıç',e);}return r;})(wizGo);

/* ---------- kulüp finansı: gelir, ligin maaş/gelir oranıyla tutarlı ---------- */
finData=(old=>function(){const F=old.apply(this,arguments);try{if(G.mode!=='mgr')return F;const S=G.s,g=wgLg(S.league),nPl=(S.results||[]).length,nTot=(S.fixtures||[]).length||1;
    const bill=squadOf(G.club).reduce((a,p)=>a+(p.k==='ME'?0:wgAnnual(p,G.club)),0),target=bill/g.r*nPl/nTot,cur=F.ti-(F.inc.find(x=>x[0]==='Oyuncu satışları')||[0,0])[1]-(F.inc.find(x=>x[0]==='UEFA ödemeleri')||[0,0])[1];
    const add=Math.max(0,target-cur);if(add>0){const sp=F.inc.find(x=>x[0]==='Sponsor ve ticari');if(sp)sp[1]+=add;F.ti+=add;}
    /* oyuncu dışı giderler (personel, tesis, işletme) — UEFA: gelirin üçte biri civarı */const op=F.exp.find(x=>x[0]==='İşletme giderleri');if(op){const need=Math.max(0,F.ti*0.3-op[1]);op[1]+=need;F.te+=need;}}catch(e){console.warn('v156 finans',e);}return F;})(finData);

/* ---------- gösterim: yıllık + haftalık, amatörde "ücret yok", yapay zekâ maaşı "tahmini" ---------- */
openModal=(old=>function(h){try{if(typeof h==='string')h=h.replace(/<small>Maaş<\/small>/g,'<small>Maaş (tahmini)</small>');}catch(e){}return old.call(this,h,...[].slice.call(arguments,1));})(openModal);
render=(old=>function(){const r=old.apply(this,arguments);try{const v=$('#view');if(!v||!G||!isPl())return r;
    v.querySelectorAll('dt').forEach(dt=>{if(dt.textContent.trim()!=='Yıllık maaş')return;const dd=dt.nextElementSibling;if(!dd||dd.dataset.wg)return;dd.dataset.wg=1;const t=dd.textContent.trim();
      if(/^0 €$/.test(t)){dd.textContent='Ücret yok';dd.title='Amatör lisans: maaş yok';}else{const a=amtParse(t);if(a!=null&&a>0)dd.insertAdjacentHTML('beforeend',`<small class="wg-hf"> · ${amtFmt(a/52)}/hf</small>`);}});
    {const tw=document.createTreeWalker(v,NodeFilter.SHOW_TEXT),L=[];let n;while((n=tw.nextNode()))if(/yıllık 0 €/i.test(n.nodeValue))L.push(n);for(const t of L)t.nodeValue=t.nodeValue.replace(/yıllık 0 €/gi,'ücret yok (amatör lisans)');}
    v.querySelectorAll('.wallet span').forEach(sp=>{if(sp.textContent.trim()!=='Yıllık maaş'||sp.dataset.wg)return;sp.dataset.wg=1;const b=sp.previousElementSibling,a=b&&amtParse(b.textContent.trim());if(a===0)b.textContent='Ücret yok';else if(a>0)sp.textContent=`Yıllık maaş · ${amtFmt(a/52)}/hf`;});
  }catch(e){}return r;})(render);
openModal=(old=>function(h){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(mc)mc.querySelectorAll('dt').forEach(dt=>{if(dt.textContent.trim()!=='Yıllık maaş')return;const dd=dt.nextElementSibling;if(!dd||dd.dataset.wg)return;dd.dataset.wg=1;const t=dd.textContent.trim();
    if(/^0 €$/.test(t))dd.textContent='Ücret yok';else{const a=amtParse(t);if(a!=null&&a>0)dd.insertAdjacentHTML('beforeend',`<small class="wg-hf"> · ${amtFmt(a/52)}/hf</small>`);}});}catch(e){}return r;})(openModal);
