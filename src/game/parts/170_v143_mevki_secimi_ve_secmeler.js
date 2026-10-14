/* ================= v143: kariyer başında mevki seçimi (saha şeması) ve mevkiye özel seçmeler =================
   - Futbolcu sihirbazında "Mevkini seç" ayrı adım: saha şemasında KL, STP, SĞB, SLB, DOS, MO, OOS, SĞK, SLK, SF.
     Seçim G.p.pos (FW/KN/OS/DF/KL) + G.p.rol (PZ_ROL) + forma numarası + role göre küçük özellik vurgusu + kanatta ayak önerisi.
   - Seçmeler: rolüne göre üç pozisyon anı (168'deki senaryolar), test başına puan, gözlemci raporu; teklifler puana bağlı. */
const MV_POS=[['ST','SF',50,20],['AML','SLK',17,36],['AMR','SĞK',83,36],['AMC','OOS',50,46],['MC','MO',50,66],['DM','DOS',50,84],['DL','SLB',16,98],['DR','SĞB',84,98],['DC','STP',50,106],['GK','KL',50,128]];
const MV_GRP={ST:'FW',AML:'KN',AMR:'KN',AMC:'OS',MC:'OS',DM:'OS',DL:'DF',DR:'DF',DC:'DF',GK:'KL'};
const MV_NUM={ST:9,AML:11,AMR:7,AMC:10,MC:8,DM:6,DL:3,DR:2,DC:4,GK:1,MR:7,ML:11,WBR:2,WBL:3};
const MV_INFO={
  ST:['Santrfor','Takımın golcüsü. Kaleciyle bire bir, geri pastan vuruş, ortaya kafa, ara pasına koşu ve önde baskı anları sana gelir.','Şut · Hız · Fizik'],
  AML:['Sol kanat','Bekle bire bir, içe kat ve vur, çizgiden orta, hızlı hücum ve geri dönüş anları.','Hız · Dribling · Pas'],
  AMR:['Sağ kanat','Bekle bire bir, içe kat ve vur, çizgiden orta, hızlı hücum ve geri dönüş anları.','Hız · Dribling · Pas'],
  AMC:['On numara','Son pası sen verirsin: ara pası, ver-kaç, uzaktan şut, dön ve çık, serbest vuruş.','Pas · Dribling · Şut'],
  MC:['Merkez orta saha','Oyunu yönlendirirsin: ara pası, oyunu öbür kanada açma, pres ve pas arası, uzaktan şut.','Pas · Dribling · Fizik'],
  DM:['Ön libero','Savunmanın önünde kalkan: pas arası, baskı altında topu çevirme, şut bloğu, taktik faul.','Defans · Pas · Fizik'],
  DL:['Sol bek','Kanatçıyla bire bir, bindirme ve orta, geri koşu, stoperi tamamlama, taç atışı.','Hız · Defans · Pas'],
  DR:['Sağ bek','Kanatçıyla bire bir, bindirme ve orta, geri koşu, stoperi tamamlama, taç atışı.','Hız · Defans · Pas'],
  DC:['Stoper','Hava topları, forvetle bire bir, ara pasını kesme, geriden oyun kurma, ofsayt çizgisi.','Defans · Fizik · Pas'],
  GK:['Kaleci','Şut kurtarma, bire birde çıkış, orta alma ya da yumruklama, penaltı, oyunu elle ve ayakla başlatma.','Refleks (Defans) · Çıkış (Hız) · Hava topu (Fizik)']};
/* role göre küçük vurgu (başlangıç özelliklerine eklenir) */
const MV_TW={DR:{hiz:3,pas:1,fiz:-2,sut:-2},DL:{hiz:3,pas:1,fiz:-2,sut:-2},DC:{def:2,fiz:2,hiz:-2,dri:-2},DM:{def:3,pas:1,sut:-2,dri:-2},MC:{pas:2,fiz:1,def:-1,sut:-2},
  AMC:{pas:2,dri:2,def:-3,fiz:-1},AMR:{hiz:1,dri:2,fiz:-2,def:-1},AML:{hiz:1,dri:2,fiz:-2,def:-1},ST:{sut:2,fiz:1,pas:-2,def:-1},GK:{}};
const MV_TRY={ST:['f_birebir','f_ceza','f_kafa'],DC:['s_orta','s_birebir','s_kur'],DR:['b_birebir','k_cizgi','k_geri'],DL:['b_birebir','k_cizgi','k_geri'],WBR:['b_birebir','k_cizgi','k_geri'],WBL:['b_birebir','k_cizgi','k_geri'],
  DM:['d_pasarasi','m_cevir','d_blok'],MC:['o_arapas','m_cevir','o_pres'],AMC:['o_arapas','o_uzak','o_sirt'],AMR:['k_birebir','k_ice','k_cizgi'],AML:['k_birebir','k_ice','k_cizgi'],MR:['k_birebir','k_ice','k_cizgi'],ML:['k_birebir','k_ice','k_cizgi'],GK:['g_kurtar','g_birebir','g_penalti']};
const mvLbl=r=>{const x=MV_POS.find(p=>p[0]===r);return x?x[1]:(DPT[r]||r);};

/* ---------- sihirbaz: mevki adımı ---------- */
function mvPitch(){const sel=W.mv;return `<svg class="mv-pitch" viewBox="0 0 100 140" role="group" aria-label="Saha şeması">
  <rect x="2" y="2" width="96" height="136" rx="3" class="mvp-g"/>${[0,1,2,3,4,5,6].map(i=>`<rect x="2" y="${2+i*19.4}" width="96" height="9.7" class="mvp-s"/>`).join('')}
  <g class="mvp-l"><rect x="2" y="2" width="96" height="136" rx="3"/><line x1="2" y1="70" x2="98" y2="70"/><circle cx="50" cy="70" r="11"/><rect x="24" y="2" width="52" height="18"/><rect x="37" y="2" width="26" height="7"/><rect x="24" y="120" width="52" height="18"/><rect x="37" y="131" width="26" height="7"/><path d="M41 20 A11 11 0 0 0 59 20"/><path d="M41 120 A11 11 0 0 1 59 120"/></g>
  ${MV_POS.map(([r,l,x,y])=>`<g class="mvp-p${sel===r?' on':''}" data-act="wzMv" data-v="${r}" tabindex="0" role="button" aria-label="${esc(MV_INFO[r][0])}"><circle cx="${x}" cy="${y}" r="7.2"/><text x="${x}" y="${y+1.6}">${l}</text></g>`).join('')}</svg>`;}
function mvTopMoments(r){const g=PZ_G[r]||'MC';return PZ_SCL.filter(s=>s.w[g]&&s.h).sort((a,b)=>b.w[g]-a.w[g]).slice(0,5).map(s=>s.n);}
function mvStep(){const st=$('#start'),r=W.mv,I=r&&MV_INFO[r];
  st.innerHTML=`<button class="btn ghost sm wz-back" data-act="wz" data-k="prof">‹ Geri</button><h2 class="h">Mevkini seç</h2>
  <p class="muted mv-lead">Maçta sana gelecek anlar, seçmelerdeki testler ve başlangıç özelliklerin mevkine göre belirlenir. Sahada bir mevkiye dokun.</p>
  <div class="mv-wrap">${mvPitch()}<div class="mv-card">${I?`<span class="kicker">${mvLbl(r)} · ${esc(POS[MV_GRP[r]].name)}</span><b>${esc(I[0])}</b><p>${esc(I[1])}</p><p class="mv-k"><span>Önemli özellikler</span>${esc(I[2])}</p>
    <p class="mv-k"><span>Maçta sık gelen anlar</span>${mvTopMoments(r).map(esc).join(' · ')}</p><p class="mv-k"><span>Seçme testleri</span>${(MV_TRY[r]||[]).map(id=>esc(PZ_SC[id].n)).join(' · ')}</p>`
    :`<b>Henüz seçmedin</b><p>Kaleciden santrfora on mevki var. Her mevkinin maç anları farklıdır: stoper hava topu ve oyun kurma, kanat bire bir ve orta, kaleci kurtarış oynar.</p>`}</div></div>
  <button class="cta big${r?'':' off'}" data-act="wzMvGo" ${r?'':'aria-disabled="true"'}><span>${r?esc(I[0])+' olarak devam':'Önce mevkini seç'}</span><small>${r?'Karakterini oluştur':'Devam etmek için sahada bir mevkiye dokun'}</small></button>`;
  window.scrollTo(0,0);}
ACTX.wzMv=el=>{const r=el.dataset.v;if(!MV_GRP[r])return;W.mv=r;SEL.pos=MV_GRP[r];SEL.rol=r;
  if(!W.footSet){if(/L$/.test(r))SEL.foot='Sol';else if(/R$/.test(r))SEL.foot='Sağ';}const y=window.scrollY;mvStep();window.scrollTo(0,y);};
ACTX.wzMvGo=()=>{if(!W.mv)return toast('Önce sahada mevkini seç');W.step='kim';showStart();};
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('[data-act=selfoot]');if(t)W.footSet=true;},true);
showStart=(old=>function(){if(W.step==='mevki'){if(W.prof!=='oyuncu'){W.step='kim';return showStart();}old.apply(this,arguments);mvStep();return;}
  if(W.step==='kim'&&W.prof==='oyuncu'&&!W.scn&&!W.mv){W.step='mevki';return showStart();}
  const r=old.apply(this,arguments);try{
    if(W.step==='prof'&&W.prof==='oyuncu'){const b=document.querySelector('#start [data-act=wz][data-k=kim]');if(b)b.dataset.k='mevki';}
    if(W.step==='kim'&&W.prof==='oyuncu'&&!W.scn&&W.mv){const st=$('#start');for(const s of ['[data-act=selpos]','.pz-rolf [data-act=selrol]']){const x=st.querySelector(s);const f=x&&x.closest('.field');if(f)f.remove();}
      const bk=st.querySelector('.wz-back');if(bk)bk.dataset.k='mevki';
      const lic=st.querySelector('.wz-lic');const I=MV_INFO[W.mv];if(lic&&I&&!st.querySelector('.mv-sum'))lic.insertAdjacentHTML('afterend',`<div class="mv-sum"><span class="mv-badge">${mvLbl(W.mv)}</span><div><b>${esc(I[0])}</b><small>${esc(I[2])}</small></div><button class="btn sm" data-act="wz" data-k="mevki">Değiştir</button></div>`);}}catch(e){console.warn('mevki',e);}
  return r;})(showStart);
/* kariyer kurulunca: numara ve role göre küçük özellik vurgusu */
wizGo=(old=>function(){const pl=W.prof==='oyuncu',mv=W.mv;const r=old.apply(this,arguments);try{if(pl&&G&&G.p&&G.mode==='player'){const p=G.p,rol=pzRol();
    if(mv&&MV_GRP[mv]===p.pos)p.rol=mv;const tw=MV_TW[p.rol]||{};for(const k in tw){p.a[k]=clamp(p.a[k]+tw[k],10,99);p.pot[k]=clamp(p.pot[k]+tw[k],p.a[k],99);}
    p.num=MV_NUM[p.rol]||p.num;p.mvSet=1;W.mv=null;W.footSet=false;save();if(G.phase!=='tryout')render();}}catch(e){console.warn('mevki',e);}return r;})(wizGo);

/* ---------- seçmeler: mevkiye özel üç an ---------- */
let MV_TRD=[];
const mvTryPlan=()=>MV_TRY[pzRol()]||null;
startTraining=(old=>function(t,kind){try{if(G&&G.p&&!TRY_PLAN[G.p.pos])TRY_PLAN[G.p.pos]=['savunma','dkorner','penalti'];}catch(e){}const r=old.apply(this,arguments);try{if(kind==='try'&&TR){const P=mvTryPlan();if(P){TR.pzP=P;TR.plan=P.slice();MV_TRD=[];trBoard();}}}catch(e){console.warn(e);}return r;})(startTraining);
trNext=(old=>function(){if(!TR||!TR.pzP)return old.apply(this,arguments);const p=G.p,[us,opp]=trClubs(),id=TR.pzP[TR.i],sc=PZ_SC[id];
  const C={cond:100,us,opp,a:p.a,energy:p.energy,morale:p.morale,up:p.up,pos:p.pos,num:p.num,hurt:false,drill:true,sub:sc.sub||'std',wx:'acik',wind:0};
  PZ.cur={sc};startMoment(sc.type,C,`Seçme ${TR.i+1}/${TR.pzP.length} · ${sc.n}`,res=>{if(!TR)return;const s=trScore(sc.type,res);TR.sc.push(s);MV_TRD.push({n:sc.n,k:sc.k||'',s,code:res.code});TR.i++;trBoard();
    if(TR.i<TR.pzP.length)setTimeout(trNext,350);else trEnd(false);});})(trNext);
tryoutEnd=(old=>function(avg,skipped){const r=old.apply(this,arguments);try{if(G.tryout){G.tryout.det=skipped?[]:MV_TRD.slice();G.tryout.rol=pzRol();}MV_TRD=[];save();render();window.scrollTo(0,0);}catch(e){}return r;})(tryoutEnd);
function mvScout(T){const D=T.det||[],I=MV_INFO[T.rol]||['Oyuncu','',''];if(!D.length)return 'Seçmede kendini gösteremedin; kulüpler yalnızca antrenman raporlarına baktı.';
  const s=D.slice().sort((a,b)=>b.s-a.s),best=s[0],worst=s[s.length-1],a=T.avg;
  const head=a>=0.66?`${I[0]} olarak bugünün en iyisiydin.`:a>=0.38?`${I[0]} mevkiinde umut veriyorsun.`:`${I[0]} için henüz hazır değilsin ama potansiyel var.`;
  return `${head} “${best.n}” testinde ${best.s>=0.9?'çok etkileyiciydin':best.s>=0.5?'iyi iş çıkardın':'zorlandın'}${worst!==best&&worst.s<0.5?`; “${worst.n}” testinde gelişmen gerek`:''}. Bu mevkide en çok bakacağımız özellikler: ${I[2]}.`;}
viewTryout=(old=>function(){const p=G.p,T=G.tryout,P=mvTryPlan();try{
  if((!T||!T.offers)&&P){const I=MV_INFO[pzRol()]||[pzRolName(),'',''];
    return `<section class="today"><div class="td-head"><div><span class="kicker">${fmtLong(today())}</span><h2 class="h">Seçme günü</h2></div><span class="pill warn">${mvLbl(pzRol())} · ${esc(I[0])}</span></div>
    <p class="td-desc"><b>${esc(I[0])}</b> mevkii için seçmedesin. Altyapı hocaları ve gözlemciler seni şu 3 testte izleyecek; performansına göre kulüpler teklif yapacak. Gözlemciler bu mevkide en çok <b>${esc(I[2])}</b> özelliklerine bakar.</p>
    <ol class="mv-try">${P.map((id,i)=>{const s=PZ_SC[id];return `<li><b>${i+1}. test · ${esc(s.n)}</b><small>${esc(s.k||'')}</small></li>`;}).join('')}</ol></section>
    <button class="cta big" data-act="tryStart"><span>Seçmelere çık</span><small>3 test · kendin oyna</small></button>
    <button class="btn" data-act="trySkip">Seçmeyi atla (ortalama performans sayılır)</button>${licenseHTML(true)}`;}}catch(e){console.warn(e);}
  const h=old.apply(this,arguments);try{if(T&&T.offers&&T.rol){const D=T.det||[];const rep=`<section class="panel mv-rep"><p class="sub-h"><span>Gözlemci raporu</span><span>${mvLbl(T.rol)} · ${esc((MV_INFO[T.rol]||[''])[0])}</span></p>
      ${D.length?`<ul class="mv-tl">${D.map(d=>`<li><span>${esc(d.n)}</span><b class="${d.s>=0.66?'g':d.s>=0.38?'m':'b'}">${Math.round(d.s*100)}</b></li>`).join('')}</ul>`:''}<p class="mv-sc">“${esc(mvScout(T))}”</p></section>`;
    return h.replace('</section>','</section>'+rep);}}catch(e){}return h;})(viewTryout);
