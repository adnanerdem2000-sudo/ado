/* ================= v172: personel — hakem (haftalık atama: orta hakem / 4. hakem / VAR, kupa ve Avrupa görevleri, MHK klasman puanı ve sıralaması, kademeli ceza, kural semineri, fiziksel test, gözlemci geri bildirimi) · gözlemci (Önerilerim takibi, haftalık gözlem kararı, itibar hedefi, sezon değerlendirmesi) · doktor (Hastalarım takibi, yük ve dönüş testi kararları, sezon değerlendirmesi) ================= */
/* Mevcut sistemlerin üstüne kurulur: 071 hakem + 119 MHK + 182 atama paneli + 196 kulüpten bağımsız hakem; 030/067 gözlemci talepleri; 027/040/068 doktor vakaları; 182 karar kuyruğu (v155Push). */

/* ---------- ortak durum ---------- */
function pr172J(){const j=stG();j.pr172=j.pr172||{};const V=j.pr172;
  if(V.y!==G.s.year){V.y=G.s.year;V.pts=0;V.n={orta:0,dort:0,var:0,kupa:0,uefa:0};V.ph=[];V.cl=V.cl||0;V.ft0=0;V.ft1=0;V.ftRe=0;V.ftBan=0;V.fb=null;V.dl=[];V.wk=null;V.ww=0;V.dw=0;}
  V.ph=V.ph||[];V.dl=V.dl||[];return V;}
const pr172Wk=()=>G.s.year*100+G.s.week;
function pr172Rep0(){const j=stG();if(j.rep0y!==G.s.year){j.rep0y=G.s.year;j.rep0=Math.round(j.rep||0);}return j.rep0;}
const pr172Day=d=>{try{return fmtDate(dateOf(d));}catch(e){return '';}};
try{V155_KIND.ref='Merkez Hakem Kurulu';}catch(e){}

/* =====================================================================
   HAKEM
   ===================================================================== */
const PR172_ROL={orta:'Orta hakem',dort:'4. hakem',var:'VAR hakemi'};
try{Object.assign(REF_TN,{tekalan:'Teknik alan',ekip:'Ekipman kontrolü',uzatma:'Uzatma süresi'});}catch(e){}
/* klasmana göre lig: aynı ülkenin bir alt ligi (bölgesel/klasman hakemlerinin orta hakemlik görevleri) */
function pr172Lo(){const B=LEAGUES[G.s.league];if(!B)return null;let best=null;
  for(const [id,L] of Object.entries(LEAGUES)){if(L.youth||L.cc!==B.cc||!(L.tier<B.tier)||L.tier<3)continue;if(leagueClubs(id).length<8)continue;if(!best||L.tier>LEAGUES[best].tier)best=id;}return best;}
function pr172Round(lid,day){try{if(lid===G.s.league){let i=G.s.cal.indexOf(day);if(i<0)i=G.s.results.length;return G.s.fixtures[i]||null;}
    const o=olSync(lid),i=o.cal.findIndex(d=>d>=day);return i>=0?o.fx[i]||null:null;}catch(e){return null;}}
const pr172HasEu=()=>{try{return cupsOf().list.some(c=>c.type==='eu'&&c.alive);}catch(e){return false;}};
const pr172Str=id=>(CLUBS[id]||{}).str||0;
/* lig maç günü ataması: rol ve maç klasmana göre (tohumlu, ekranda görünen ile oynanan aynı) */
function pr172Asg(day){if(!isRef()||!G.s||dayType(day)!=='mac')return null;const j=refJob(),lvl=j.lvl|0,V=pr172J();
  const r=srng('pr172a'+G.s.year+'-'+day+'-'+lvl);r();const B=G.s.league,Lo=pr172Lo(),varOk=((LEAGUES[B]||{}).tier||0)>=8;let role='orta',lid=B;const u=r();
  if(lvl===0){if(u<0.72){if(Lo)lid=Lo;}else role='dort';}
  else if(lvl===1){if(u<0.5){}else if(u<0.68){if(Lo)lid=Lo;}else if(u<0.88)role='dort';else role=varOk?'var':'dort';}
  else if(lvl===2){if(u<0.64){}else if(u<0.86)role=varOk?'var':'dort';else role='dort';}
  else{if(u<0.68){}else if(u<0.94)role=varOk?'var':'dort';else role='dort';}
  if(role==='orta'&&V.ftBan&&day<=V.ftBan)role='dort';
  if(lvl>=3&&role==='orta'&&!pr172HasEu()&&r()<0.2){const tops=['pl','ll','it1','de1','fr1'].filter(l=>LEAGUES[l]&&LEAGUES[l].cc!==(LEAGUES[B]||{}).cc);const L1=leagueClubs(tops[Math.floor(r()*tops.length)]||'pl'),L2=leagueClubs(tops[Math.floor(r()*tops.length)]||'pl');
    const a=L1[Math.floor(r()*L1.length)],b=L2.filter(x=>a&&x.id!==a.id)[Math.floor(r()*Math.max(1,L2.length-1))];if(a&&b)return {role:'orta',h:a.id,a:b.id,lid:a.league,uefa:1};}
  let rows=pr172Round(lid,day);if((!rows||!rows.length)&&lid!==B){lid=B;rows=pr172Round(B,day);}
  rows=(rows||[]).filter(x=>x&&CLUBS[x[0]]&&CLUBS[x[1]]);if(!rows.length)return {role,lid,none:1};
  const S=rows.slice().sort((x,y)=>(pr172Str(y[0])+pr172Str(y[1]))-(pr172Str(x[0])+pr172Str(x[1])));let pool=S;
  if(role!=='orta')pool=S.slice(0,Math.max(1,Math.ceil(S.length/3)));else if(lid===B){if(lvl>=3)pool=S.slice(0,2);else if(lvl===2)pool=S.slice(0,Math.ceil(S.length/2));else if(lvl<=1)pool=S.slice(Math.floor(S.length*0.4));}
  const f=pool[Math.floor(r()*pool.length)]||S[0];return {role,h:f[0],a:f[1],lid};}
/* kupa günü ataması: yurt içi kupada klasman hakemi 4. hakem, üst klasman orta hakem; Avrupa'da FIFA kokartlı orta hakem, üst klasman 4. hakem */
function pr172CupAsg(day){if(!isRef())return null;let cu=null;try{cu=cupDayFor(day);}catch(e){}if(!cu)return null;const j=refJob(),lvl=j.lvl|0,k=cu.c,R=cu.r;const r=srng('pr172k'+G.s.year+'-'+day+'-'+lvl);r();
  if(k.type==='eu'){let role=lvl>=3?'orta':lvl===2&&r()<0.6?'dort':null;if(!role)return null;const cc=(LEAGUES[G.s.league]||{}).cc;
    const P=(k.parts||[]).filter(id=>id!==G.club&&CLUBS[id]&&(LEAGUES[CLUBS[id].league]||{}).cc!==cc);if(P.length<2)return null;
    const a=P[Math.floor(r()*P.length)],rest=P.filter(x=>x!==a),b=rest[Math.floor(r()*rest.length)];return {role,h:a,a:b,lid:CLUBS[a].league,uefa:1,cup:k.name,rn:R.n};}
  const role=lvl>=2?'orta':lvl===1?'dort':null;if(!role||!k.opp||!CLUBS[k.opp])return null;const home=R.neutral?true:!!R.home;
  return {role,h:home?G.club:k.opp,a:home?k.opp:G.club,lid:G.s.league,cup:k.name,rn:R.n,dom:1};}
/* refFx: atama artık klasmana göre (görevden uzaklaştırmada atama yok) */
refFx=(old=>function(){if(!isRef())return old.apply(this,arguments);try{const M=mhkOf();if(M.susp>0)return null;const t=dayType(G.s.day);
    const A=t==='mac'?pr172Asg(G.s.day):t==='kupa'?pr172CupAsg(G.s.day):null;if(!A||A.none)return null;return Object.assign({},A);}catch(e){console.warn('pr172 atama',e);return old.apply(this,arguments);}})(refFx);
/* ---------- MHK puanı ve klasman sıralaması ---------- */
function pr172Pts(role,rt,F){let p;if(role==='orta')p=rt>=9?5:rt>=8.6?4:rt>=8.3?3:rt>=7.8?2:rt>=7?1:rt>=6.4?-1:-3;else p=rt>=8.6?2:rt>=8?1.5:rt>=7.3?0.5:-1;
  if(F&&(F.uefa||F.cup)&&p>0)p*=F.uefa?1.5:1.25;return Math.round(p*2)/2;}
function pr172Add(p,why){const V=pr172J();V.pts=Math.round((V.pts+p)*10)/10;V.ph.unshift({d:G.s.day,p,why});if(V.ph.length>40)V.ph.length=40;}
const PR172_AD=['Ahmet','Burak','Cem','Deniz','Emre','Fatih','Gökhan','Hakan','İlker','Kaan','Levent','Mert','Necati','Oğuz','Rıza','Sinan','Tamer','Ufuk','Volkan','Yiğit'],
  PR172_SOY=['Akbulut','Bozkurt','Ceylan','Duman','Ekinci','Fırat','Güneri','Işıklar','Karadağ','Kocabaş','Mutlu','Nalbant','Oral','Pehlivan','Sarıgül','Tekin','Uçar','Vural','Yalçın','Zengin'];
/* klasmandaki diğer (kurgusal) hakemler: oynanan lig haftası kadar tohumlu puan toplar */
function pr172Peers(){const j=refJob(),V=pr172J(),key=G.s.year+'-'+(j.lvl|0)+'-'+G.s.league;
  if(!V.peers||V.pk!==key){const r=srng('pr172p'+key+(G.p.name||''));r();const used=new Set([PN()]),L=[];for(let i=0;i<14;i++){let n,g=0;do{n=PR172_AD[Math.floor(r()*20)]+' '+PR172_SOY[Math.floor(r()*20)];}while(used.has(n)&&g++<40);used.add(n);L.push({n,q:Math.round((r()*2-1)*100)/100});}V.peers=L;V.pk=key;}
  const W=(G.s.results||[]).length;return V.peers.map((P,i)=>{let s=0;for(let w=0;w<W;w++){const r=srng('pr172w'+key+'-'+i+'-'+w);r();const u=r()+r()+r()-1.5;s+=clamp(2.5+P.q*1.0+u*2.2,-3,5);}return {n:P.n,pts:Math.round(s*2)/2};});}
function pr172Rank(){const V=pr172J(),L=pr172Peers().concat([{n:PN(),pts:V.pts,me:1}]).sort((a,b)=>b.pts-a.pts||(b.me?1:0)-(a.me?1:0));const me=L.findIndex(x=>x.me)+1,N=L.length;
  return {L,me,N,up:L[2]?L[2].pts:0,down:L[N-3]?L[N-3].pts:0,pts:V.pts};}
/* ---------- 4. hakem ve VAR görevleri ---------- */
const PR172_TA={uyar:['İlk kez teknik alandan çıktı; uyarınca hemen geri çekiliyor','Kollarını açıp itiraz ediyor ama hakaret yok','Yedek kulübesine dönüp söyleniyor'],
  sari:['Daha önce sözlü uyarı almıştı, yine teknik alanın dışında','Su şişesini yere fırlatıp karara itiraz ediyor','Yardımcı hakeme ısrarla bağırıyor, sakinleşmiyor'],
  kirmizi:['Sahaya girip hakemin üzerine yürüyor','Rakip kulübeyle itişmeye başladı','Hakemlere hakaret içeren sözler söylüyor']};
const PR172_EK={izin:['Tekmelikleri yerinde, takı yok','Krampon dişleri sağlam, ekipmanı kurallara uygun'],duzelt:['Bileğinde metal bir bilezik görünüyor','Kramponunun bir dişi kırılmış, sivri kalmış','Boynunda zincir kolye var']};
function pr172Run(){const R=G&&G.pr172run;if(R&&R.day===G.s.day&&G.phase==='season')return R;if(G&&G.pr172run)G.pr172run=null;return null;}
function pr172Items(F,role){const out=[],c=refClarity();
  if(role==='var'){let L=[];try{L=refMkInc(F);}catch(e){}let V=L.filter(I=>I.var);if(V.length<2)V=L;V=V.slice(0,3);
    for(const I of V){const wrong=Math.random()<0.32,others=I.o.map(o=>o[0]).filter(x=>x!==I.truth),on=wrong&&others.length?pick(others):I.truth;let rep='';
      try{const T=INC.find(x=>x.t===I.t);if(T&&T.c&&T.c[I.truth])rep=refSent(pick(T.c[I.truth]),I.att,I.def);}catch(e){}
      out.push({k:'var',m:I.m,t:I.t,q:I.q,cues:(I.cues||[]).slice(0,3),rep,on,truth:I.truth,o:I.o});}
    return out.sort((a,b)=>a.m-b.m);}
  /* 4. hakem: ekipman kontrolü, teknik alan, uzatma süresi */
  const ek=Math.random()<0.35?'duzelt':'izin',sqH=squadOf(F.h).slice().sort((a,b)=>b.ovr-a.ovr),sub=pick(sqH.slice(11,18))||sqH[0];
  out.push({k:'ekip',m:rint(55,68),t:'ekip',q:`Oyuncu değişikliği: ${sub?sub.name:'yedek oyuncu'} oyuna girmeye hazırlanıyor. Ekipman kontrolü sende.`,cues:[Math.random()<c?pick(PR172_EK[ek]):pick(PR172_EK[ek==='izin'?'duzelt':'izin']),pick(PR172_EK[ek])],truth:ek,o:[['izin','Girişine izin ver'],['duzelt','Önce ekipmanı düzelttir']]});
  const s=wpick([['uyar',0.5],['sari',0.38],['kirmizi',0.12]]),side=Math.random()<0.5?F.h:F.a;let co='Teknik direktör';try{co=coachOf(side).n;}catch(e){}
  const cue2=Math.random()<c?pick(PR172_TA[s]):pick(PR172_TA[pick(['uyar','sari','kirmizi'].filter(x=>x!==s))]);
  out.push({k:'tekalan',m:rint(69,84),t:'tekalan',q:`${(CLUBS[side]||{}).short||''} kulübesi: ${co} karara tepki gösteriyor.`,cues:[...new Set([pick(PR172_TA[s]),cue2])],truth:s,o:[['uyar','Sözlü uyar'],['sari','Hakemi çağır: sarı kart'],['kirmizi','Hakemi çağır: kırmızı kart']]});
  const g=rint(1,4),su=rint(6,10),inj=rint(0,3),vr=hasVAR(F)?rint(0,2):0,ws=Math.random()<0.5?1:0,sec=su*30+g*45+inj*60+vr*60+ws*45,T=Math.max(1,Math.floor(sec/60));
  const opts=[...new Set([T-1,T,T+1,T+2].filter(x=>x>=1))].slice(0,3);if(!opts.includes(T))opts[0]=T;
  out.push({k:'uzatma',m:90,t:'uzatma',q:'İkinci yarı bitiyor: uzatma süresini tabelaya sen yazacaksın.',cues:[`${g} gol, ${su} oyuncu değişikliği`,`${inj?inj+' dakika sağlık müdahalesi':'sağlık müdahalesi yok'}${vr?` · ${vr} dakika VAR incelemesi`:''}`,ws?'Son dakikalarda belirgin zaman geçirme oldu':'Belirgin zaman geçirme yok'],
    help:'Hesap: değişiklik başına 30 sn, gol sevinci 45 sn, sağlık müdahalesi ve VAR incelemesi geçen süre kadar, belirgin zaman geçirme 45 sn; toplam aşağı yuvarlanır.',truth:String(T),o:opts.sort((a,b)=>a-b).map(x=>[String(x),`+${x} dakika`])});
  return out;}
function pr172Start(F){const role=F.role;G.pr172run={day:G.s.day,F,role,items:pr172Items(F,role),i:0,rt:8.3,log:[]};save();pr172Show();}
function pr172Head(F){const lg=F.uefa?(F.cup||'UEFA maçı'):F.cup?F.cup:esc((LEAGUES[F.lid]||{}).short||'');
  return `<p class="sub-h"><span>${lg}${F.rn?' · '+esc(F.rn):''}</span><span>${esc(PR172_ROL[F.role]||'')}</span></p><div class="prep-opp">${crestSVG(CLUBS[F.h],34)}<b>${esc(CLUBS[F.h].short)}</b><i>vs</i><b>${esc(CLUBS[F.a].short)}</b>${crestSVG(CLUBS[F.a],34)}</div>`;}
function pr172Show(){const R=pr172Run();if(!R)return;const I=R.items[R.i],F=R.F;if(!I)return pr172Finish();const lab=k=>(I.o.find(o=>o[0]===k)||[k,k])[1];
  const body=I.k==='var'?`<p class="ref-q">${esc(I.q)}</p><p class="pr172-on">Sahadaki karar: <b>${esc(lab(I.on))}</b></p><ul class="ref-c">${I.cues.map(c=>`<li>${esc(c)}</li>`).join('')}${I.rep?`<li class="pr172-rp">📺 Tekrar açısı: ${esc(I.rep)}</li>`:''}</ul>
      <p class="muted">VAR yalnız “açık ve net hata”da hakemi monitöre çağırır. Kararın?</p><div class="seg"><button class="chip" data-act="pr172Ans" data-k="ok">Kontrol tamam · karar doğru</button><button class="chip" data-act="pr172Ans" data-k="ofr">Hakemi monitöre çağır</button></div>`
    :`<p class="ref-q">${esc(I.q)}</p><ul class="ref-c">${I.cues.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>${I.help?`<p class="muted pr172-help">${esc(I.help)}</p>`:''}<div class="seg">${I.o.map(([k,l])=>`<button class="chip" data-act="pr172Ans" data-k="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  openModal(`<div class="refm pr172-run"><h3>${R.role==='var'?'VAR odası':'4. hakem'} · ${I.m}’</h3>${pr172Head(F)}<p class="sub-h" style="margin:4px 0"><span>Görev ${R.i+1}/${R.items.length}</span></p>${body}</div>`);}
ACTX.pr172Ans=el=>{const R=pr172Run();if(!R)return;const I=R.items[R.i];if(!I)return;const k=el.dataset.k;let ok,d=0,why='',res='doğru';
  if(I.k==='var'){const wrong=I.on!==I.truth;if(k==='ofr'&&wrong){ok=1;R.rt+=0.3;res='açık hata yakalandı';}else if(k==='ok'&&!wrong){ok=1;R.rt+=0.12;}else if(k==='ofr'){ok=0;d=-0.45;why='Sahadaki karar doğruydu: gereksiz müdahale';}else{ok=0;d=-0.8;why='Açık hata kaçtı: hakem monitöre çağrılmalıydı';}}
  else if(I.k==='uzatma'){const diff=Math.abs(+k-+I.truth);if(!diff){ok=1;R.rt+=0.25;}else if(diff===1){ok=1;R.rt+=0.02;res='kabul edilebilir';}else{ok=0;d=-0.4;why=`Doğrusu +${I.truth} dakika`;}}
  else{if(k===I.truth){ok=1;R.rt+=0.18;}else{ok=0;const sev=I.k==='tekalan'&&(k==='kirmizi'||I.truth==='kirmizi');d=sev?-0.6:-0.35;why=I.k==='tekalan'?`Doğrusu: ${(I.o.find(o=>o[0]===I.truth)||['',''])[1].toLowerCase()}`:I.truth==='duzelt'?'Kurala aykırı ekipmanla oyuna girdi':'Gereksiz bekletme, oyun gecikti';}}
  if(!ok)R.rt+=d;R.log.push(ok?[I.m,I.t,res]:[I.m,I.t,'hatalı',d,why]);try{toast(ok?`✔ ${res==='doğru'?'Doğru karar':res}`:`✖ ${why}`);}catch(e){}R.i++;save();
  if(R.i<R.items.length)pr172Show();else pr172Finish();};
function pr172Finish(){const R=pr172Run();if(!R)return;const j=refJob(),F=R.F;const rt=Math.round(clamp(R.rt+gauss()*0.08,5,9.6)*10)/10;
  const fee=Math.round((REF_FEE[j.lvl]||150)*0.4);G.p.money+=E2U(fee);j.rn=(j.rn||0)+1;stGrow(rt>=8.3?0.3:rt<7?-0.15:0.1);
  j.rlog.unshift({y:seasonLabel(G.s.year),d:G.s.day,h:F.h,a:F.a,lid:F.lid,uefa:F.uefa||0,rt,log:R.log,rol:R.role,cup:F.cup||''});if(j.rlog.length>40)j.rlog.length=40;
  const V=pr172J(),p=pr172Pts(R.role,rt,F);V.n[R.role]=(V.n[R.role]||0)+1;if(F.cup)V.n[F.uefa?'uefa':'kupa']++;pr172Add(p,`${PR172_ROL[R.role]} · ${(CLUBS[F.h]||{}).short||''}–${(CLUBS[F.a]||{}).short||''}`);
  G.pr172run=null;const last=p;try{if(F.cup)PR172C.cup=1;refAfter({F,rt,fee,log:R.log,pr172:1});}catch(e){console.warn('pr172 bitiş',e);PR172C.cup=0;}pr172Patch(R.role,last);}
/* rapor penceresine görev ve MHK puanı */
function pr172Patch(role,p){try{const mc=$('#modalCard'),h=mc&&mc.querySelector('.refm h3');if(!h||/·/.test(h.textContent))return;h.textContent=`Maç sonu raporu · ${PR172_ROL[role]||'Orta hakem'}`;
    const rk=pr172Rank(),b=mc.querySelector('.refm button.cta');const box=`<p class="pr172-pts">MHK puanı <b class="${p>=0?'pos':'neg'}">${p>=0?'+':''}${dec(p,1)}</b> · sezon toplamı ${dec(rk.pts,1)} · klasmanda ${rk.me}./${rk.N}</p>`;if(b)b.insertAdjacentHTML('beforebegin',box);}catch(e){}}
/* orta hakemlik maçı bitince MHK puanı (kupa günü maçı lig haftasını oynatmaz) */
const PR172C={cup:0};
refAfter=(old=>function(info){let p=null;try{if(info&&info.F&&isRef()&&!info.pr172){const F=info.F,V=pr172J();p=pr172Pts('orta',info.rt,F);V.n.orta++;if(F.cup)V.n[F.uefa?'uefa':'kupa']++;
      pr172Add(p,`Orta hakem · ${(CLUBS[F.h]||{}).short||''}–${(CLUBS[F.a]||{}).short||''}`);const e=(info.log||[]).filter(l=>l[2]==='hatalı').length;V.fb={d:G.s.day,rt:info.rt,e,h:F.h,a:F.a};if(F.cup)PR172C.cup=1;}}catch(e){console.warn('pr172 puan',e);}
  const r=old.apply(this,arguments);if(p!=null)pr172Patch('orta',p);return r;})(refAfter);
staffMatch=(old=>function(){if(isRef()&&PR172C.cup){PR172C.cup=0;try{if(cupToday()){v170RefCup();return;}}catch(e){console.warn('pr172 kupa',e);}}return old.apply(this,arguments);})(staffMatch);
/* yorgun çıkılan maç (ek kondisyon sonrası) */
refFinish=(old=>function(){try{const V=pr172J();if(REF&&V.tired){REF.rt-=0.1;V.tired=0;}}catch(e){}return old.apply(this,arguments);})(refFinish);
/* ana sayfa ve 3B düğmesi: 4. hakem / VAR görevi kendi akışında; kupa günü görevi */
ACTX.refGo=(old=>function(el){try{if(isRef()&&G.phase==='season'){if(G.refLive&&G.refLive.day===G.s.day&&G.refLive.inc&&G.refLive.i<G.refLive.inc.length)return old.apply(this,arguments);
      if(pr172Run())return pr172Show();const t=dayType(G.s.day),F=(t==='mac'||t==='kupa')?refFx():null;
      if(F&&F.role&&F.role!=='orta')return pr172Start(F);
      if(F&&t==='kupa'){REF={F,inc:refMkInc(F),i:0,rt:8.3,log:[],varQ:null};refModal();return;}
      if(t==='kupa'){try{v170RefCup();}catch(e){}save();render();return;}}}catch(e){console.warn('pr172 refGo',e);}return old.apply(this,arguments);})(ACTX.refGo);
ACTX.ref3=(old=>function(el){try{if(isRef()){if(pr172Run())return pr172Show();const t=dayType(G.s.day);if(t==='kupa')return ACTX.refGo(el);const F=t==='mac'?refFx():null;if(F&&F.role&&F.role!=='orta')return pr172Start(F);}}catch(e){}return old.apply(this,arguments);})(ACTX.ref3);
closeModal=(old=>function(){try{const mc=$('#modalCard');if(pr172Run()&&mc&&mc.querySelector('.pr172-run')){toast('Görev sürüyor: önce kararını ver');return;}}catch(e){}return old.apply(this,arguments);})(closeModal);
refHub=(old=>function(){let h=old.apply(this,arguments);try{if(!isRef()||G.phase!=='season')return h;const t=dayType(G.s.day);
    if(t==='mac'){const F=refFx(),run=pr172Run();if(F&&F.role){h=h.replace('<span>Bugünkü görevin</span>',`<span>Bugünkü görevin · <b class="pr172-rol r-${F.role}">${PR172_ROL[F.role]}</b></span>`);
        if(F.role!=='orta'){h=h.replace(/<button[^>]*data-act="ref3"[\s\S]*?<\/button>/,'').replace(/<button[^>]*data-act="refSer"[\s\S]*?<\/button>/,'');
          h=h.replace(/(<button class="cta big" data-act="refGo"><span>)[^<]*(<\/span><small>)[^<]*(<\/small>)/,`$1${run?'Göreve dön':F.role==='var'?'VAR odasına geç':'Göreve başla'}$2${F.role==='var'?'Görüntüleri izle, açık hatada hakemi monitöre çağır':'Ekipman kontrolü, teknik alan ve uzatma süresi'}$3`);}}}
    else if(t==='kupa'){const F=refFx();if(F){const tk=`<section class="ticket"><div class="ticket-head"><span>Kupa görevin · <b class="pr172-rol r-${F.role}">${PR172_ROL[F.role]}</b></span><span>${esc(F.cup||'')}${F.rn?' · '+esc(F.rn):''}</span></div><div class="prep-opp">${crestSVG(CLUBS[F.h],40)}<b>${esc(CLUBS[F.h].name)}</b><i>vs</i><b>${esc(CLUBS[F.a].name)}</b>${crestSVG(CLUBS[F.a],40)}</div></section><button class="cta big" data-act="refGo"><span>${pr172Run()||(G.refLive&&G.refLive.day===G.s.day)?'Göreve dön':F.role==='orta'?'Maçı yönet':'Göreve başla'}</span><small>${F.uefa?'Avrupa görevi · VAR var':'Kupa maçı'}</small></button>`;
        h=h.replace(/<button class="cta big" data-act="stCup">[\s\S]*?<\/button>/,tk);}}}catch(e){console.warn('pr172 hub',e);}return h;})(refHub);
/* 3B yönetim ve "yalnız ciddi kararlar" yalnız orta hakemlikte (107/124 bunları ana sayfaya sonradan ekler) */
viewHub=(old=>function(){let h=old.apply(this,arguments);try{if(isRef()&&G.phase==='season'){const t=dayType(G.s.day),F=t==='mac'||t==='kupa'?refFx():null;
    if(F&&(F.role!=='orta'||t==='kupa'))h=h.replace(/<button[^>]*data-act="ref3"[\s\S]*?<\/button>/,'').replace(/<button[^>]*data-act="refSer"[\s\S]*?<\/button>/,'');}}catch(e){}return h;})(viewHub);
staffAdvance=(old=>function(){if(!isRef())return old.apply(this,arguments);let g=0;
  while(g++<60&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac')break;if(t==='kupa'){if(pr172CupAsg(G.s.day)&&!(mhkOf().susp>0))break;try{v170RefCup();}catch(e){nextDay();}continue;}staffDay();nextDay();}
  save();render();window.scrollTo(0,0);})(staffAdvance);
mdStopT=(old=>function(t){try{if(isRef()&&t==='kupa')return (refJob().lvl|0)>=1;}catch(e){}return old.apply(this,arguments);})(mdStopT);
/* ---------- kademeli ceza: ilk ağır ihlal yazılı uyarı; 8 başarılı görev sicilden bir ihlal siler ---------- */
mhkApply=(old=>function(R,rt){try{if(isRef()&&R){const M=mhkOf(),V=pr172J(),big=R.big||0,ab=R.abuse||0,heavy=ab>=1||big>=2||rt<6.4;
      if(heavy&&!M.marks&&!M.pr172fw){M.pr172fw=1;M.warn=(M.warn||0)+1;V.cl=0;const F=R.F,mt=F&&CLUBS[F.h]&&CLUBS[F.a]?`${CLUBS[F.h].name} – ${CLUBS[F.a].name}`:'Son maç';
        msg('board','MHK: yazılı uyarı',`${mt} maçındaki yönetimin MHK'de incelendi (${[big?big+' ciddi hata':'',ab?'gerekçesiz kart':'',`gözlemci notu ${dec(rt,1)}`].filter(Boolean).join(', ')}). Sicilinde ağır ihlal olmadığı için bu kez yazılı uyarıyla yetinildi. Bir sonraki ağır ihlal görevden uzaklaştırma getirir; ardından klasman düşürme, kurs ve en son men gelir.`);return;}
      if(heavy)V.cl=0;else if(rt>=7.8){V.cl=(V.cl||0)+1;if(V.cl>=8&&M.marks>0&&M.marks<4){M.marks--;V.cl=0;msg('board','MHK: sicil iyileşti',`Art arda 8 başarılı görevin ardından sicilindeki bir ağır ihlal silindi. Sicil: ${M.marks}/4.`);}}}}catch(e){console.warn('pr172 mhk',e);}
  return old.apply(this,arguments);})(mhkApply);
/* ---------- atama ve MHK paneli (182 refObsHTML yerine) ---------- */
function pr172Upcoming(n){const out=[];if(!G.s||!G.s.cal)return out;const M=mhkOf();let susp=M.susp||0;
  for(let d=G.s.day;d<G.s.day+60&&out.length<n;d++){let t='';try{t=dayType(d);}catch(e){}
    if(t==='mac'){if(susp>0){susp--;out.push({d,ban:1});continue;}const A=pr172Asg(d);out.push(Object.assign({d},A||{none:1}));}
    else if(t==='kupa'&&!susp){const A=pr172CupAsg(d);if(A)out.push(Object.assign({d},A));}}
  return out;}
function pr172Ladder(M){const st=['Yazılı uyarı','Görevden uzaklaştırma','Klasman düşürme','Kurs ve uzaklaştırma','Men'],cur=M.marks>=4?4:M.marks>=3?3:M.marks>=2?2:M.marks>=1?1:(M.pr172fw||M.warn)?0:-1;
  return `<div class="v155-ladder pr172-ladder">${st.map((s,i)=>`<span class="${i<=cur?'on':''}">${s}</span>`).join('')}</div>`;}
function pr172RowHTML(x){const RT=REF_TN||{};const role=x.ban?'':`<b class="pr172-rol r-${x.role}">${PR172_ROL[x.role]||''}</b> `;
  return `<li><span>${pr172Day(x.d)}</span><b>${x.ban?'⛔ Görev yok (MHK cezası)':x.none?'Atama bekleniyor':`${role}${esc((CLUBS[x.h]||{}).name||'')} – ${esc((CLUBS[x.a]||{}).name||'')}`}</b><em>${x.ban||x.none?'':x.cup?esc(x.cup):x.uefa?'UEFA':esc((LEAGUES[x.lid]||{}).short||'')}</em></li>`;}
refObsHTML=function(){const j=refJob(),M=mhkOf(),V=pr172J(),up=pr172Upcoming(3),last=(j.rlog||[])[0],RT=typeof REF_TN!=='undefined'?REF_TN:{},rk=pr172Rank(),T=STF.ref.r,top=j.lvl>=T.length-1;
  const gap=Math.max(0,Math.round((rk.up-rk.pts)*10)/10),pct=rk.up>0?clamp(Math.round(rk.pts/rk.up*100),0,100):rk.pts>0?100:0;
  const brk=last?`<p class="sub-h" style="margin:12px 0 6px"><span>Son görev · gözlemci raporu</span><span>${esc((CLUBS[last.h]||{}).short||'')} – ${esc((CLUBS[last.a]||{}).short||'')} · <b class="${last.rt>=8.3?'pos':last.rt<7?'neg':''}">${dec(last.rt,1)}</b></span></p>
    <ul class="v155-obs"><li><span>${esc(PR172_ROL[last.rol||'orta'])}${last.cup?' · '+esc(last.cup):''}</span><b>Başlangıç 8,3</b></li>${(last.log||[]).slice(0,6).map(l=>`<li><span>${l[0]}’ ${esc(RT[l[1]]||'Pozisyon')}</span><b class="${l[2]==='hatalı'?'neg':'pos'}">${esc(l[2])}</b></li>`).join('')}</ul>`:'<p class="muted">Henüz görev yapmadın; ilk görevinden sonra gözlemci notunun dökümü burada görünür.</p>';
  const nn=V.n||{};
  return `<section class="panel v155-ref pr172-mhk"><p class="sub-h"><span>Atamalar ve MHK</span><span>${esc(j.title)}</span></p>
   <p class="sub-h" style="margin:4px 0 6px"><span>Sıradaki görevler</span><span>Her lig haftası bir atama</span></p><ul class="cupres v155-up">${up.map(pr172RowHTML).join('')||'<li><b>Sezon bitti</b></li>'}</ul>
   <p class="sub-h" style="margin:12px 0 6px"><span>Klasman yarışı</span><span>${top?'En üst klasman':`Terfi: ${esc(T[j.lvl+1]||'')}`}</span></p>
   <div class="strip pr172-strip"><div><b>${dec(rk.pts,1)}</b><span>MHK puanı</span></div><div><b>${rk.me}/${rk.N}</b><span>Sıralama</span></div><div><b>${rk.me<=3?'✓':dec(gap,1)}</b><span>${top?'İlk 3’e':'Terfiye'} kalan</span></div><div><b>${(nn.orta||0)}·${(nn.dort||0)+(nn.var||0)}</b><span>Orta · 4./VAR</span></div></div>
   <div class="st-goals"><div class="st-g"><span>Terfi hattı (3.)</span><i><em style="width:${pct}%" class="${rk.me<=3?'ok':''}"></em></i><b>${dec(rk.pts,1)} / ${dec(rk.up,1)}</b></div></div>
   <p class="muted" style="margin:6px 0 0">Sezon sonunda MHK değerlendirir: klasmanında ilk 3 bir üst klasmana çıkar${j.lvl>0?', son 2 bir alt klasmana düşer':''}. Orta hakemlikte not 8,3+ = +3, 8,6+ = +4, 7,0 altı eksi puan; 4. hakem ve VAR görevleri +0,5…+2; kupa ×1,25, Avrupa ×1,5. Kural semineri ve fiziksel test de puan getirir.</p>
   ${brk}
   <p class="sub-h" style="margin:12px 0 6px"><span>MHK sicili</span><span>${M.marks}/4${M.susp>0?` · ${M.susp} maç ceza`:''}</span></p>${pr172Ladder(M)}
   <p class="muted" style="margin:6px 0 0">Ceza kademelidir: ilk ağır ihlal yazılı uyarı, sonrakiler görevden uzaklaştırma, klasman düşürme, kurs; men ancak dördüncü sicil ihlalinde. Art arda 8 başarılı görev sicilden bir ihlali siler.</p>
   <div class="day-ctas"><button class="btn" data-act="navGo" data-tab="refs">Klasman sıralaması ve raporlar</button></div></section>`;};
/* maç raporları sayfası: sıralama + görev türleri */
viewRefs=(old=>function(){if(!isRef()||!G.s)return old.apply(this,arguments);try{const j=refJob(),V=pr172J(),rk=pr172Rank(),M=mhkOf(),nn=V.n||{};
    const rows=rk.L.map((x,i)=>`<li class="${x.me?'pr172-me':''} ${i<3?'pr172-upz':i>=rk.N-2&&j.lvl>0?'pr172-dnz':''}"><span>${i+1}.</span><b>${esc(x.n)}${x.me?' (sen)':''}</b><em>${dec(x.pts,1)}</em></li>`).join('');
    const logs=(j.rlog||[]).map(x=>`<li><span>${x.y}${x.uefa?' · UEFA':x.cup?' · '+esc(x.cup):''}</span><b><b class="pr172-rol r-${x.rol||'orta'}">${PR172_ROL[x.rol||'orta']}</b> ${esc((CLUBS[x.h]||{}).short||'')} – ${esc((CLUBS[x.a]||{}).short||'')}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${(x.log||[]).filter(l=>l[2]==='hatalı').length} hatalı karar · ${(x.log||[]).length} görev/pozisyon</small></b><em class="${x.rt>=8.3?'res-w':x.rt<7?'res-l':''}">${dec(x.rt,1)}</em></li>`).join('');
    const ph=(V.ph||[]).slice(0,10).map(x=>`<li><span>${pr172Day(x.d)}</span><b>${esc(x.why||'')}</b><em class="${x.p>=0?'res-w':'res-l'}">${x.p>=0?'+':''}${dec(x.p,1)}</em></li>`).join('');
    return `<h2 class="h">Maç raporları</h2><section class="panel"><p class="sub-h"><span>${esc(seasonLabel(G.s.year))} · ${esc(j.title)} klasmanı</span><span>${rk.me}./${rk.N}</span></p>
      <p class="muted" style="margin:0 0 8px">Yeşil bölge (ilk 3) sezon sonunda bir üst klasmana çıkar${j.lvl>0?'; kırmızı bölge (son 2) düşer':''}. Diğer hakemler aynı klasmandaki meslektaşların.</p><ul class="cupres pr172-rank">${rows}</ul></section>
      <section class="panel"><p class="sub-h"><span>Bu sezon görevlerin</span><span>${(nn.orta||0)+(nn.dort||0)+(nn.var||0)} görev</span></p><div class="strip"><div><b>${nn.orta||0}</b><span>Orta hakem</span></div><div><b>${nn.dort||0}</b><span>4. hakem</span></div><div><b>${nn.var||0}</b><span>VAR</span></div><div><b>${(nn.kupa||0)+(nn.uefa||0)}</b><span>Kupa/Avrupa</span></div></div>
      ${ph?`<p class="sub-h" style="margin:10px 0 6px"><span>MHK puan hareketleri</span></p><ul class="cupres">${ph}</ul>`:''}</section>
      ${V.rev?pr172RevHTML():''}
      <section class="panel"><p class="sub-h"><span>Görev geçmişi</span><span>Sicil ${M.marks}/4</span></p><ul class="cupres">${logs||'<li><b>Henüz görev yapmadın</b></li>'}</ul></section>`;}catch(e){console.warn('pr172 raporlar',e);return old.apply(this,arguments);}})(viewRefs);
/* ---------- hakem: sezon içi kararlar (kural semineri, fiziksel test, gözlemci geri bildirimi) ---------- */
const PR172_SEM=[
  ['Kale vuruşundan topu doğrudan alan oyuncu ofsayt pozisyonundaydı. Karar?',[['a','Ofsayt yok, oyun devam'],['b','Endirekt serbest vuruş'],['c','Kale vuruşu tekrarlanır']],'a','Kale vuruşu, korner ve taç atışından doğrudan ofsayt olmaz (Kural 11).'],
  ['Taç atışında top doğrudan rakip kaleye girdi. Karar?',[['a','Gol geçerli'],['b','Rakip lehine kale vuruşu'],['c','Taç tekrarlanır']],'b','Taç atışından doğrudan gol olmaz; top rakip kaleye girerse kale vuruşu verilir (Kural 15).'],
  ['Ceza sahasında net gol şansı, topa oynama girişimiyle yapılan faulle engellendi. Karar?',[['a','Penaltı ve kırmızı kart'],['b','Penaltı ve sarı kart'],['c','Yalnız penaltı']],'b','Ceza sahasında topa oynama girişimiyle engellenen net gol şansında penaltı ve sarı kart verilir (Kural 12).'],
  ['Kaleci topu elinde 8 saniyeden uzun tuttu. Karar?',[['a','Endirekt serbest vuruş'],['b','Rakip lehine korner'],['c','Sözlü uyarı']],'b','2025/26 kural değişikliği: kaleci topu 8 saniyeden uzun elinde tutarsa rakip lehine korner verilir (Kural 12).'],
  ['Top hakeme çarptı ve rakip takım umut vaat eden bir atak başlattı. Karar?',[['a','Oyun devam eder'],['b','Hakem atışı, topa son dokunan takıma'],['c','Endirekt serbest vuruş']],'b','Hakeme çarpan top takım değiştirir ya da umut vaat eden atak başlatırsa oyun durur, hakem atışı yapılır (Kural 9).'],
  ['Ofsayt pozisyonundaki oyuncu, savunmacının kasıtlı pasından (kurtarış değil) topu aldı. Karar?',[['a','Ofsayt'],['b','Ofsayt yok'],['c','Hakem atışı']],'b','Rakibin kasıtlı oynaması (kurtarış hariç) ofsayt pozisyonundaki oyuncuyu ofsayt yapmaz (Kural 11).'],
  ['Hücumcunun koluna kazara çarpan topla hemen ardından gol geldi. Karar?',[['a','Gol geçerli'],['b','Gol iptal, elle oynama'],['c','Gol geçerli, sarı kart']],'b','Kazara da olsa elle/kolla temasın hemen ardından gol atan oyuncunun golü geçersizdir (Kural 12).'],
  ['Doğrudan serbest vuruşta top, vuruşu kullanan takımın kendi kalesine girdi. Karar?',[['a','Gol geçerli'],['b','Rakip lehine korner'],['c','Vuruş tekrarlanır']],'b','Serbest vuruştan doğrudan kendi kalesine gol olmaz; rakip lehine korner verilir (Kural 13).'],
  ['Penaltı vuruşu anında kalecinin konumu nasıl olmalı?',[['a','İki ayağı da çizginin önünde'],['b','En az bir ayağının bir kısmı kale çizgisine değmeli ya da hizasında olmalı'],['c','Kale alanı içinde serbest']],'b','Vuruş anında kalecinin en az bir ayağının bir kısmı kale çizgisine değer ya da hizasında olur (Kural 14).'],
  ['Avantaj verdiğin faul sarı kartlıktı. Kartı ne zaman gösterirsin?',[['a','Kart gösterilmez'],['b','Oyun ilk durduğunda'],['c','Devre arasında']],'b','Avantaj uygulanan ihlalin kartı oyun ilk durduğunda gösterilir (Kural 12).'],
  ['Yedek oyuncu ne zaman oyuncu sayılır?',[['a','Hakem işaret verdiğinde'],['b','Oyun alanına girdiğinde'],['c','Değişiklik tabelası kalkınca']],'b','Yedek oyuncu, çıkan oyuncu ayrıldıktan sonra oyun alanına girdiğinde oyuncu olur (Kural 3).'],
  ['Korner atışında top ne zaman oyuna girer?',[['a','Ceza sahasından çıkınca'],['b','Vurulup açıkça hareket edince'],['c','İkinci bir oyuncu dokununca']],'b','Korner atışında top vurulup açıkça hareket ettiği anda oyundadır (Kural 17).']];
function pr172RefDay(){const V=pr172J(),S=G.s;if(v155().q.length)return;const t=dayType(S.day);if(t==='mac'||t==='kupa')return;const j=refJob(),played=(S.results||[]).length;
  /* gözlemci geri bildirimi: orta hakemlik maçının ertesi günleri */
  if(V.fb&&S.day-V.fb.d>=1&&S.day-V.fb.d<=4){const f=V.fb;V.fb=null;const mt=`${(CLUBS[f.h]||{}).name||''} – ${(CLUBS[f.a]||{}).name||''}`;
    v155Push({g:'ref',k:'pr172_fb',key:f.d,t:'MHK gözlemci geri bildirimi',ans:f.e===0&&f.rt>=8?'itiraz':'video',fb:f,
      b:`<p>${esc(mt)} maçı için gözlemci raporu geldi: not <b>${dec(f.rt,1)}</b>, ${f.e?`<b>${f.e}</b> hatalı karar`:'hatalı karar yok'}.</p><p class="muted">Gözlemci ${f.e?'pozisyon alma ve kart tutarlılığı üzerine notlar düşmüş':'yalnız koşu çizgin ve oyuncu yönetimi hakkında küçük notlar düşmüş'}.</p>`,
      o:[['video','Video analizine katıl','Hatalarını eğitmenle incele · yetenek ve MHK puanı biraz artar'],['itiraz','Rapora itiraz et','Raporda hata yoksa not düzeltilir; haksızsan MHK puanı düşer'],['kabul','Notu kabul et, devam','Bir şey değişmez']]});return;}
  /* fiziksel test: sezonda iki kez (ilk hafta ve devre arası), başarısızlıkta 2 hafta sonra tekrar */
  const due=(!V.ft0&&played>=1)||(!V.ft1&&played>=Math.floor(NR()/2))||(V.ftRe&&S.day>=V.ftRe);
  if(due){const which=!V.ft0?0:!V.ft1?1:2;if(which<2){if(which===0)V.ft0=1;else V.ft1=1;}V.ftRe=0;
    v155Push({g:'ref',k:'pr172_ft',key:S.day,t:'MHK fiziksel testi',ans:'ek',b:`<p>Merkez Hakem Kurulu bu hafta fiziksel test yapıyor: tekrarlı sprint ve aralıklı dayanıklılık koşusu. Testi geçemeyen hakeme bir hafta orta hakemlik verilmez.</p><p class="muted">Hakemlik yeteneğin ${Math.round(j.sk)}; geçme şansın hazırlığına bağlı.</p>`,
      o:[['ek','Ek kondisyon çalış','Geçme şansı yüksek · sonraki maça biraz yorgun çıkarsın (not −0,1)'],['normal','Normal hazırlan','Geçme şansı orta'],['ertele','Sağlık raporuyla ertele','MHK puanı −1 · test 2 hafta sonra']]});return;}
  /* kural semineri: üç haftada bir */
  if(played>=2&&v155Due('pr172sem',21)){v155Mark('pr172sem');const used=V.semU||[];let qi=PR172_SEM.findIndex((_,i)=>!used.includes(i));if(qi<0){V.semU=[];qi=Math.floor(Math.random()*PR172_SEM.length);}V.semU=(V.semU||[]).concat([qi]);
    const Q=PR172_SEM[qi],o=shuffle(Q[1].slice());v155Push({g:'ref',k:'pr172_sem',key:S.day,qi,ans:Q[2],t:'Kural semineri sınavı',b:`<p>MHK’nin aylık kural seminerinde sınav sorusu:</p><p><b>${esc(Q[0])}</b></p>`,o:o.map(([k,l])=>[k,l,''])});}}
V155_DEC.pr172_fb=(ev,k)=>{const f=ev.fb||{};if(k==='video'){stGrow(0.5);pr172Add(0.5,'Video analizi');return 'Video analizi · yetenek ve MHK puanı arttı';}
  if(k==='itiraz'){if((f.e||0)===0&&(f.rt||0)>=8){pr172Add(1,'İtiraz kabul edildi');msg('board','MHK: itirazın kabul edildi','Gözlemci raporundaki eleştiriler maç görüntüleriyle örtüşmedi; puanın düzeltildi.');return 'İtiraz kabul edildi · MHK +1';}
    pr172Add(-1,'İtiraz reddedildi');msg('board','MHK: itirazın reddedildi','Görüntüler gözlemcinin tespitlerini doğruladı. Kurul, raporlara gereksiz itirazdan hoşlanmaz.');return 'İtiraz reddedildi · MHK −1';}return 'Not kabul edildi';};
V155_DEC.pr172_ft=(ev,k)=>{const j=refJob(),V=pr172J();if(k==='ertele'){pr172Add(-1,'Fiziksel test ertelendi');V.ftRe=G.s.day+14;return 'Test ertelendi · MHK −1';}
  const p=clamp(0.55+(j.sk||40)/250+(k==='ek'?0.2:0),0.3,0.97);if(k==='ek')V.tired=1;
  if(Math.random()<p){pr172Add(2,'Fiziksel testi geçti');msg('board','MHK: fiziksel testi geçtin','Sprint ve dayanıklılık değerlerin klasman ortalamasının üstünde.');return 'Fiziksel test geçildi · MHK +2';}
  pr172Add(-2,'Fiziksel testten kaldı');V.ftBan=G.s.day+7;V.ftRe=G.s.day+14;msg('board','MHK: fiziksel testten kaldın','Bir hafta orta hakemlik görevi verilmeyecek (4. hakem/VAR görevi alabilirsin). Test iki hafta sonra tekrarlanacak.');return 'Testten kaldın · MHK −2';};
V155_DEC.pr172_sem=(ev,k)=>{const Q=PR172_SEM[ev.qi]||[];const ok=k===ev.ans;if(ok){pr172Add(1,'Kural semineri: doğru');stGrow(0.4);}else pr172Add(-0.5,'Kural semineri: yanlış');
  msg('board',ok?'MHK kural semineri: doğru cevap':'MHK kural semineri: yanlış cevap',`${Q[0]||''} Doğru cevap: ${((Q[1]||[]).find(o=>o[0]===ev.ans)||['',''])[1]}. ${Q[3]||''}`);return ok?'Doğru · MHK +1':'Yanlış · MHK −0,5';};
/* ---------- sezon sonu MHK değerlendirmesi: sıralamaya göre terfi / düşme ---------- */
staffSeasonEnd=(old=>function(){if(!isRef())return old.apply(this,arguments);let st=null;try{st=pr172Rank();const j=refJob();j.rgood=0;j.rbad=0;}catch(e){console.warn(e);}
  const r=old.apply(this,arguments);try{if(st)pr172RefEnd(st);}catch(e){console.warn('pr172 sezon sonu',e);}return r;})(staffSeasonEnd);
function pr172RefEnd(st){const j=refJob(),V=pr172J(),T=STF.ref.r,yl=seasonLabel(G.s.year),M=mhkOf();let res='stay';
  if(st.me<=3&&j.lvl<T.length-1){j.lvl++;res='up';}else if(st.me>=st.N-1&&j.lvl>0){j.lvl--;res='down';}
  if(res!=='stay'){j.title=T[j.lvl];if(G.contract){G.contract.role=j.title;G.contract.wage=Math.round(G.contract.wage*(res==='up'?1.3:0.8)/50)*50;}}
  if(res==='up'){G.trophies.push({year:yl,name:`Terfi: ${j.title}`,club:G.club});if(G.summary)G.summary.awards=[j.title];if(j.lvl>=3&&!G.trophies.some(t=>/FIFA kokartı/.test(t.name)))G.trophies.push({year:yl,name:'FIFA kokartı',club:G.club});}
  j.rep=clamp((j.rep||0)+clamp((st.N/2-st.me)*0.8,-6,6),0,100);if(G.summary)G.summary.score=Math.round(st.pts);
  try{const n=Math.min(5,1+Math.floor(j.rep/22));if(res!=='stay')j.offers=staffOffers(j.lvl,Math.max(2,n));}catch(e){}
  if(!M.marks)M.pr172fw=0;
  const nn=V.n||{},A=(j.rlog||[]).filter(x=>x.y===yl),avg=A.length?A.reduce((a,x)=>a+x.rt,0)/A.length:0;
  V.rev={k:'ref',yl,rank:st.me,N:st.N,pts:st.pts,res,title:j.title,n:Object.assign({},nn),avg:Math.round(avg*100)/100,marks:M.marks};
  msg('board','MHK sezon sonu değerlendirmesi',`${yl} sezonunu klasmanında ${st.me}. sırada (${dec(st.pts,1)} puan) bitirdin. ${res==='up'?`Terfi! Yeni klasmanın: ${j.title}.`:res==='down'?`Klasmanın son iki hakemi arasında kaldın; ${j.title} klasmanına düştün.`:`${j.title} klasmanında kalıyorsun.`} Görevler: ${nn.orta||0} orta hakem, ${nn.dort||0} 4. hakem, ${nn.var||0} VAR${(nn.kupa||0)+(nn.uefa||0)?`, ${(nn.kupa||0)+(nn.uefa||0)} kupa/Avrupa`:''}. Not ortalaman ${A.length?dec(avg,2):'-'}.`);}

/* =====================================================================
   GÖZLEMCİ
   ===================================================================== */
const pr172ScOn=()=>isStaff()&&G.staff==='scout'&&G.job;
function pr172ScWk(){const V=pr172J(),w=pr172Wk();if(!V.wk||V.wk.w!==w)V.wk={w,watch:[],nw:[],prop:0,rep:0};return V.wk;}
/* transfer talebi iki aşamalı: önce inceleme (sportif direktör oyuncuyu izler), sonra karar */
rqResolve=(old=>function(r){try{if(r&&r.st==='bekliyor'&&!r.pr172i&&pr172ScOn()){r.pr172i=1;r.ilgi=G.s.day;r.due=G.s.day+2;const p=pByKey(r.k);
      if(p)msg('scout',`Önerin inceleniyor: ${p.name}`,`Sportif direktör ${p.name} için yazdığın raporu okudu; oyuncuyu yerinde izleyip menajeriyle ön görüşme yapacak. Karar 2 gün içinde. Süreci Önerilerim ekranından izleyebilirsin.`);return;}}catch(e){}
  const res=old.apply(this,arguments);try{if(r){r.dd=G.s.day;if(r.st==='tamam'||r.st==='basarisiz')r.teklif=G.s.day;}}catch(e){}return res;})(rqResolve);
scRequest=(old=>function(k){const j=jobInit(),n0=(j.rq||[]).length;const r=old.apply(this,arguments);try{if((j.rq||[]).length>n0)pr172ScWk().prop++;}catch(e){}return r;})(scRequest);
scReport=(old=>function(k){const j=jobInit(),n0=(j.reps||[]).length;const r=old.apply(this,arguments);try{if((j.reps||[]).length>n0){j.reps[0].d=G.s.day;pr172ScWk().rep++;}}catch(e){}return r;})(scReport);
/* haftalık gözlem kararı */
function pr172ScDay(){const S=G.s,V=pr172J(),j=jobInit();if(v155().q.length)return;const t=dayType(S.day);if(t==='mac'||t==='kupa')return;const w=pr172Wk();if(V.ww===w)return;
  const md=nextMatchDay(S.day);if(md!=null&&md-S.day>5)return;V.ww=w;scNet();
  const L=(j.short||[]).map(pByKey).filter(p=>p&&scCid(p)!==G.club&&scAcc(p)<5).sort((a,b)=>scAcc(a)-scAcc(b)||potOf(b)-potOf(a)).slice(0,2);
  const o=L.map(p=>['izle:'+p.k,`${p.name} maçına git`,`${(CLUBS[scCid(p)]||{}).short||''} · ${p.pos} · ${p.age} yaş · bilgi %${scAcc(p)*20} → %${Math.min(5,scAcc(p)+2)*20}`]);
  o.push(['kesif','Bölge maçına git, yeni yetenek ara','Ağındaki liglerden bir genç oyuncu listene ve keşiflerine girer']);
  if(!L.length&&(j.inbox||[]).length)o.push(['inbox','Ağdan gelen raporları incele','Alt gözlemcilerinin raporladığı oyuncu listene eklenir']);
  const due=j.task&&!j.task.done?`<p class="muted">Açık kulüp talebi: ${esc(POS_TR[j.task.pos]||j.task.pos)} · en fazla ${j.task.age} yaş · bütçe ${eur(j.task.bud)}.</p>`:'';
  v155Push({g:'scout',k:'pr172_sc',key:w,ans:o[0][0],t:'Haftanın gözlem planı',b:`<p>Bu hafta hangi maça gideceksin? Canlı izlediğin oyuncunun güç ve potansiyel aralığı daralır; öneri yaparken yönetim raporunun netliğine bakar.</p>${due}`,o});}
V155_DEC.pr172_sc=(ev,k)=>{const j=jobInit(),W=pr172ScWk();scNet();
  if(k.startsWith('izle:')){const pk=k.slice(5),p=pByKey(pk);if(!p)return '';const a0=scAcc(p);j.kn[pk]=Math.min(4,(j.kn[pk]||0)+2);const a1=scAcc(p);j.lvW=G.s.week;try{regAdd(scPCC(p),3);}catch(e){}W.watch.push({k:pk,a0,a1});
    return `${p.name}: bilgi %${a0*20} → %${a1*20}`;}
  if(k==='inbox'){const pk=(j.inbox||[]).shift();const p=pk&&pByKey(pk);if(!p)return '';if(!j.short.includes(pk))j.short.unshift(pk);j.kn[pk]=Math.max(j.kn[pk]||0,1);W.nw.push(pk);return `${p.name} listene eklendi`;}
  let lids=[];try{lids=netLeagues();}catch(e){}if(!lids.length)lids=[G.s.league];const lid=pick(lids),have=new Set(j.short);
  const C=leagueClubs(lid).filter(c=>c.id!==G.club).flatMap(c=>squadOf(c.id)).filter(p=>p.age<=21&&!have.has(p.k)).sort((a,b)=>potOf(b)-potOf(a)).slice(0,8),p=pick(C);if(!p)return 'Bu hafta göze çarpan oyuncu yoktu';
  j.short.unshift(p.k);j.kn[p.k]=Math.max(j.kn[p.k]||0,1);j.disc=j.disc||{};if(!j.disc[p.k])j.disc[p.k]={y:G.s.year,o:p.ovr,pt:potOf(p),c:scCid(p),v:pValue(p),own:1};j.lvW=G.s.week;W.nw.push(p.k);try{regAdd(LEAGUES[lid].cc,3);}catch(e){}
  msg('scout',`Yeni keşif: ${p.name}`,`${LEAGUES[lid].name} maçında ${p.name} (${p.age}, ${p.pos}, ${(CLUBS[scCid(p)]||{}).name||''}) dikkatini çekti; gözlem listene ve keşiflerine eklendi.`);return `Yeni keşif: ${p.name}`;};
/* Önerilerim: önerildi → incelendi → teklif → transfer oldu/olmadı → kulüpteki performans */
function pr172Perf(p,est){const cid=scCid(p),c=CLUBS[cid],ps=(G.s.ps||{})[p.k];let role='';try{role=squadRoles(cid)[p.k]||'';}catch(e){}
  return `<small class="pr172-perf">Şimdi ${esc(c?c.short:'')}${role?' · '+esc(role):''} · güç ${R200(p.ovr)}${est!=null?` (raporun ${R200(Math.round(est))})`:''}${ps?` · bu sezon ${ps.g||0} gol, ${ps.a||0} asist`:''}</small>`;}
function pr172Tl(steps){return `<div class="pr172-tl">${steps.map(([l,s])=>`<span class="${s}">${esc(l)}</span>`).join('<i>›</i>')}</div>`;}
function pr172OnrList(){const j=jobInit(),out=[];scNet();
  for(const r of j.rq||[]){const p=pByKey(r.k);if(!p)continue;const st=r.st,ins=r.pr172i||st!=='bekliyor';
    const steps=[[`Önerildi · ${pr172Day(r.day)}`,'on'],[ins?`İncelendi${r.ilgi?' · '+pr172Day(r.ilgi):''}`:'İnceleme bekliyor',ins?(st==='red'?'x':'on'):'wait']];
    if(st==='red')steps.push(['Yönetim reddetti','x']);else{steps.push([st==='tamam'||st==='basarisiz'?`Teklif${r.teklif?' · '+pr172Day(r.teklif):''}`:'Teklif',st==='tamam'||st==='basarisiz'?'on':'wait']);steps.push([st==='tamam'?'Transfer oldu':st==='basarisiz'?'Transfer olmadı':'Sonuç',st==='tamam'?'ok':st==='basarisiz'?'x':'wait']);}
    out.push({d:r.day||0,y:r.y,h:`<div class="pr172-onr"><div class="pr172-onh"><b>${esc(p.name)}</b><small>${r.y} · ${p.pos} · ${p.age} yaş · ${eur(r.price)} · talep</small></div>${pr172Tl(steps)}${r.why?`<small class="why">${esc(r.why)}</small>`:''}${st==='tamam'?pr172Perf(p,r.est):''}</div>`});}
  for(const r of j.reps||[]){const p=pByKey(r.k);if(!p)continue;const steps=[[`Görev raporu${r.d?' · '+pr172Day(r.d):''}`,'on'],['Yönetim kararı',r.ok?'on':'x'],[r.ok?'Transfer oldu':'Önerilmedi',r.ok?'ok':'x']];
    out.push({d:r.d||0,y:r.y,h:`<div class="pr172-onr"><div class="pr172-onh"><b>${esc(p.name)}</b><small>${r.y} · ${p.pos} · ${p.age} yaş · kulüp talebi</small></div>${pr172Tl(steps)}${r.ok?pr172Perf(p,r.ovr):''}</div>`});}
  return out.sort((a,b)=>String(b.y).localeCompare(String(a.y))||b.d-a.d);}
function viewV172Onr(){if(!pr172ScOn())return '<p class="muted">Bu ekran gözlemciler içindir.</p>';const j=jobInit(),yl=seasonLabel(G.s.year),L=pr172OnrList(),R=(j.rq||[]).filter(r=>r.y===yl);
  const tr=R.filter(r=>r.st==='tamam'),pend=R.filter(r=>r.st==='bekliyor').length,acc=tr.filter(r=>r.real!=null),err=acc.length?acc.reduce((a,r)=>a+Math.abs(r.real-r.est),0)/acc.length:null,V=pr172J();
  return `<h2 class="h">Önerilerim</h2><section class="panel"><p class="sub-h"><span>${esc(yl)} sezonu</span><span>Talep hakkı ${Math.max(0,rqLimit()-(j.rqN||0))}/${rqLimit()}</span></p>
    <div class="strip"><div><b>${R.length}</b><span>Öneri</span></div><div><b>${pend}</b><span>İncelemede</span></div><div><b>${tr.length+(j.reps||[]).filter(r=>r.y===yl&&r.ok).length}</b><span>Transfer</span></div><div><b>${err==null?'-':'±'+dec(err,1)}</b><span>Rapor sapması</span></div></div>
    <p class="muted" style="margin:6px 0 0">Gözlem listendeki oyuncuya “Transfer talebi” gönderdiğinde süreç burada adım adım ilerler. Transfer olan oyuncunun kulüpteki rolü, gücü ve golleri raporunla karşılaştırılır.</p></section>
    ${L.length?`<section class="panel">${L.map(x=>x.h).join('')}</section>`:'<section class="panel"><p class="muted">Henüz öneri yok. Gözlem listesinden bir oyuncu için transfer talebi gönder ya da kulüp talebine rapor yaz.</p><button class="btn" data-act="navGo" data-tab="club">Gözlem masasına git</button></section>'}
    ${V.rev&&V.rev.k==='scout'?pr172RevHTML():''}`;}
/* ana sayfada haftalık özet kartı */
function pr172ScCard(){const j=jobInit(),W=pr172ScWk(),yl=seasonLabel(G.s.year),R=(j.rq||[]).filter(r=>r.y===yl),pend=R.filter(r=>r.st==='bekliyor').length,tr=R.filter(r=>r.st==='tamam').length,rp=(j.reps||[]).filter(r=>r.y===yl).length;
  const wl=W.watch.map(x=>{const p=pByKey(x.k);return p?`${esc(p.name)} %${x.a0*20}→%${x.a1*20}`:'';}).filter(Boolean),nw=W.nw.map(k=>(pByKey(k)||{}).name).filter(Boolean);
  const line=wl.length||nw.length||W.prop||W.rep?[wl.length?`${wl.length} maç izledin: ${wl.join(', ')}`:'',nw.length?`yeni: ${nw.map(esc).join(', ')}`:'',W.prop?`${W.prop} öneri`:'',W.rep?`${W.rep} görev raporu`:''].filter(Boolean).join(' · '):'Bu hafta henüz maç izlemedin; haftanın gözlem planı Devam ile gelir.';
  return `<section class="panel pr172-wkc"><p class="sub-h"><span>Bu hafta · ${G.s.week}. hafta</span><span>${pend?`${pend} öneri incelemede`:''}</span></p><p class="pr172-wl">${line}</p>
    <div class="strip"><div><b>${R.length}</b><span>Öneri</span></div><div><b>${tr}</b><span>Transfer</span></div><div><b>${rp}/6</b><span>Sezon raporu</span></div><div><b>${Math.round(j.rep||0)}</b><span>İtibar</span></div></div>
    <div class="day-ctas"><button class="btn" data-act="navGo" data-tab="pr172o">Önerilerim · süreç ve performans</button></div></section>`;}

/* =====================================================================
   DOKTOR
   ===================================================================== */
const pr172DrOn=()=>isStaff()&&G.staff==='dr'&&G.job;
let PR172_DELEG=0;
function pr172Pl(){const j=stG();j.pr172pl=j.pr172pl||[];return j.pr172pl;}
function pr172Eta(w){const up=(G.s.cal||[]).slice((G.s.results||[]).length);return up[Math.max(0,w-1)]!=null?up[w-1]:G.s.day+7*w;}
ACTX.drDeleg=(old=>function(){PR172_DELEG=1;try{return old.apply(this,arguments);}finally{PR172_DELEG=0;}})(ACTX.drDeleg);
drDiag=(old=>function(ci,o){const j=stG(),cs=j.cases&&j.cases[ci];const r=old.apply(this,arguments);try{if(cs&&cs.step===1&&pr172DrOn()){const D=DR_INJ[cs.i];toast(cs.ok?`✔ Doğru teşhis: ${D[0]}`:`✘ Yanlış teşhis · gerçek durum: ${D[0]}`);const V=pr172J();V.dx=(V.dx||0)+1;}}catch(e){}return r;})(drDiag);
drTreat=(old=>function(ci,t){const j=stG(),cs=j.cases&&j.cases[ci];const sn=cs&&cs.step===1?{k:cs.k,n:cs.name,i:cs.i,dx:cs.dx,ok:!!cs.ok,src:cs.src}:null;const r=old.apply(this,arguments);
  try{if(sn&&pr172DrOn()&&j.inj&&j.inj[sn.k]){const e=j.inj[sn.k],P=pr172Pl();let id='std';try{id=drIdeal(sn.i);}catch(x){}
      P.unshift({k:sn.k,n:sn.n,i:sn.i,dx:sn.dx,ok:sn.ok,t,id,w:e.w,d0:G.s.day,eta:pr172Eta(e.w),eta0:pr172Eta(e.w),y:seasonLabel(G.s.year),by:PR172_DELEG?'asistan':'sen',ri:0,src:sn.src});if(P.length>40)P.length=40;}}catch(x){console.warn('pr172 tedavi',x);}return r;})(drTreat);
/* maç: dönüşler, nüksler, yük kararının sonucu */
staffMatch=(old=>function(){if(!pr172DrOn())return old.apply(this,arguments);const j=stG(),md=G.s.day,before={};for(const k in (j.inj||{}))before[k]=j.inj[k].w;const c0=new Set((j.cases||[]).map(c=>c.k)),V=pr172J(),L=V.ld&&!V.ld.done?V.ld:null;
  const r=old.apply(this,arguments);
  try{const P=pr172Pl();const seen=new Set();for(const e of P){if(e.ret!=null||seen.has(e.k))continue;seen.add(e.k);if(before[e.k]==null)continue;const now=j.inj[e.k];
      if(!now){e.ret=md;if(e.test){const good=(e.test.ready&&e.test.d!=='bekle')||(!e.test.ready&&e.test.d!=='erken');pr172DrLog(`${e.n}: dönüş testi kararın`,good?'iyi':'zayıf',good?'Oyuncu sorunsuz döndü':'Dönüş gereğinden uzun sürdü');}}
      else if(before[e.k]<=1&&now.w>=2){e.ri=(e.ri||0)+1;e.eta=pr172Eta(now.w);if(e.test&&e.test.d==='erken'&&!e.test.ready)pr172DrLog(`${e.n}: erken dönüş onayı`,'kötü','Hazır değildi, sakatlık nüksetti');}}
    if(L){L.done=1;const hit=(j.cases||[]).some(c=>c.k===L.k&&!c0.has(c.k))||!!(j.inj&&j.inj[L.k]&&before[L.k]==null);const risky=L.p>=0.06;
      const good=hit?L.d!=='normal'&&false:(risky?L.d!=='normal':L.d!=='dinlen');const txt=hit?`${L.n} maçta sakatlandı${L.d==='normal'?'; yük uyarısı dikkate alınmadı':''}.`:L.d==='dinlen'?(risky?`${L.n} dinlendirildi; yük değerleri normale döndü.`:`${L.n} dinlendirildi ama yük düşüktü; hoca gereksiz bulduğunu söyledi.`):L.d==='azalt'?`${L.n} bireysel programla maçı sorunsuz tamamladı.`:risky?`${L.n} riskli yükte oynadı; bu kez şanslıydınız.`:`${L.n} normal programla sorunsuz oynadı.`;
      pr172DrLog(`Yük kararı · ${L.n}`,hit?'kötü':good?'iyi':'zayıf',txt);if(hit)stBoard(-2);else if(good){stBoard(1);stGrow(0.3);}else if(L.d==='dinlen')stBoard(-1);msg('injury','Yük kararının sonucu',txt);}}catch(e){console.warn('pr172 doktor maç',e);}
  return r;})(staffMatch);
function pr172DrLog(t,res,txt){const V=pr172J();V.dl.unshift({d:G.s.day,t,res,txt});if(V.dl.length>20)V.dl.length=20;}
/* haftalık karar: dönüş testi > yük kararı > önleyici program */
function pr172DrDay(){const S=G.s,V=pr172J(),j=stG();if(v155().q.length)return;const t=dayType(S.day);if(t==='mac'||t==='kupa')return;const w=pr172Wk();if(V.dw===w)return;
  const md=nextMatchDay(S.day);if(md!=null&&md-S.day>4)return;V.dw=w;const risk=(()=>{try{return drRisk();}catch(e){return 0.2;}})();
  const P=pr172Pl(),cand=Object.entries(j.inj||{}).filter(([k,e])=>e.w===2&&!e.pr172t).map(([k,e])=>({k,e,pe:P.find(x=>x.k===k&&x.ret==null)}));
  if(cand.length){const c=cand[0],p=pByKey(c.k);if(p){c.e.pr172t=1;const good=c.pe&&c.pe.ok&&(c.pe.t===c.pe.id||(c.pe.id==='agr'&&c.pe.t==='std'));const ready=Math.random()<(good?0.72:0.42);const sw=Math.random()<risk;const rd=sw?!ready:ready;
      const kv=rd?rint(90,97):rint(74,86),sp=rd?'Tekrarlı sprintleri ağrısız tamamladı':'Son tekrarlarda belirgin topallama';
      v155Push({g:'dr',k:'pr172_ret',key:c.k+'-'+S.day,pk:c.k,ready,ans:ready?'erken':'bekle',t:`Sahaya dönüş testi: ${p.name}`,mt:'injury',
        b:`<p>${esc(p.name)} (${esc(c.e.n)}) planlanan dönüşüne 2 maç uzaklıkta. Teknik direktör bu hafta oynayıp oynayamayacağını soruyor.</p><ul class="ref-c"><li>Kuvvet testi: sakat bacak sağlamın %${kv}’i</li><li>${sp}</li><li>Oyuncunun beyanı: “${pick(['Kendimi hazır hissediyorum','Biraz çekiniyorum ama oynarım','Hâlâ tam güvenmiyorum'])}”</li></ul><p class="muted">Testin yanılma payı ekipman ve deneyiminle düşer (şu an %${Math.round(risk*100)}).</p>`,
        o:[['erken','Erken dönüşe onay ver','Bu hafta kadroda · hazır değilse nüks riski çok yüksek'],['plan','Plana sadık kal','Planlanan tarihte döner'],['bekle','Bir maç daha beklet','Nüks riski yarıya iner · hoca sabırsızlanır']]});return;}}
  const X=(()=>{try{return staffXI(G.club);}catch(e){return null;}})(),xi=X?X.xi.map(x=>x[1]).filter(Boolean):squadOf(G.club).slice(0,11);
  const ld=xi.filter(p=>!(j.inj||{})[p.k]&&!(j.rest&&j.rest[p.k]===stWk())).map(p=>({p,L:(j.load||{})[p.k]||0})).sort((a,b)=>b.L-a.L)[0];
  if(ld&&ld.L>=110){const pr=Math.max(0,(ld.L+86-200)/900),sw=Math.random()<risk,hi=sw?pr<0.06:pr>=0.06;
    V.ld={k:ld.p.k,n:ld.p.name,L:ld.L,p:pr,d:null,done:0};
    v155Push({g:'dr',k:'pr172_ld',key:w,pk:ld.p.k,ans:pr>=0.06?'azalt':'normal',t:`Yük raporu: ${ld.p.name}`,mt:'injury',
      b:`<p>GPS ve laboratuvar verilerine göre ${esc(ld.p.name)} haftanın en yüklü oyuncusu. Hoca hafta sonu maçında ilk 11’de düşünüyor.</p><ul class="ref-c"><li>Birikmiş yük: <b>${Math.round(ld.L)}</b> (maç sonrası ~${Math.round(ld.L+86)}; 210 üstü kas sakatlığı riski)</li><li>CK (kas hasarı) değeri: ${hi?'referansın belirgin üstünde':'normal aralıkta'}</li><li>Uyku ve toparlanma anketi: ${hi?'yorgun':'iyi'}</li></ul>`,
      o:[['azalt','Bireysel program (yükü azalt)','Oynar, yükü düşer · küçük hazırlık kaybı'],['normal','Normal programla devam','Takım için en iyisi · risk aynen kalır'],['dinlen','Bu maçta dinlendir','Sakatlık riski yok · önemli oyuncuysa hoca rahatsız olur']]});return;}
  const mo=dateOf(S.day).getUTCMonth(),win=[11,0,1].includes(mo),avgL=xi.reduce((a,p)=>a+((j.load||{})[p.k]||0),0)/Math.max(1,xi.length);const ans=win?'bag':avgL>=90?'top':'kas';
  v155Push({g:'dr',k:'pr172_pv',key:w,ans,t:'Haftanın önleyici sağlık programı',mt:'injury',b:`<p>Sağlık ekibi bu haftanın önleme odağını soruyor.</p><ul class="ref-c"><li>Mevsim: ${win?'kış, revirde grip vakaları artıyor':'grip dönemi değil'}</li><li>İlk 11 ortalama yük: ${Math.round(avgL)}</li></ul>`,
    o:[['kas','Kas sakatlığı önleme (hamstring programı)','Maç sakatlıkları bu hafta azalır'],['bag','Bağışıklık (aşı, vitamin, hijyen)','Hastalık vakaları bu hafta azalır'],['top','Toparlanma (uyku, beslenme)','Oyuncuların birikmiş yükü düşer']]});}
V155_DEC.pr172_ret=(ev,k)=>{const j=stG(),e=j.inj&&j.inj[ev.pk],p=pByKey(ev.pk);if(!e||!p)return 'Oyuncu artık sakat değil';const P=pr172Pl().find(x=>x.k===ev.pk&&x.ret==null);
  if(k==='erken'){e.w=1;e.risk*=ev.ready?1:3;}else if(k==='bekle'){e.w=3;e.risk*=0.5;j.tr=clamp((j.tr||60)-1,0,100);}else if(!ev.ready)e.risk*=1.4;
  if(P){P.test={d:k,ready:ev.ready};P.eta=pr172Eta(e.w);}return k==='erken'?`${p.name} bu hafta kadroda`:k==='bekle'?`${p.name} bir maç daha bekleyecek`:'Plan değişmedi';};
V155_DEC.pr172_ld=(ev,k)=>{const j=stG(),V=pr172J(),L=V.ld;if(!L||L.k!==ev.pk)return '';L.d=k;
  if(k==='dinlen'){j.rest=j.rest||{};j.rest[L.k]=stWk();return `${L.n} bu maçta dinlenecek`;}if(k==='azalt'){j.load=j.load||{};j.load[L.k]=(j.load[L.k]||0)*0.6;L.p=Math.max(0,(j.load[L.k]+86-200)/900);return `${L.n} bireysel programda`;}return `${L.n} normal programla devam`;};
V155_DEC.pr172_pv=(ev,k)=>{const j=stG(),V=pr172J();V.pv={k,w:pr172Wk()};const good=k===ev.ans;if(k==='top'){j.load=j.load||{};for(const x in j.load)j.load[x]*=0.85;}
  pr172DrLog('Önleyici program',good?'iyi':'zayıf',good?'Haftanın ihtiyacına uygun odak':'Bu hafta başka bir odak daha yararlı olurdu');if(good)stBoard(0.5);return {kas:'Hamstring programı',bag:'Bağışıklık programı',top:'Toparlanma programı'}[k]||'';};
drCaseNew=(old=>function(p,src,fi){try{const V=G&&G.job&&G.job.pr172;if(pr172DrOn()&&V&&V.pv&&V.pv.w===pr172Wk()&&fi==null){if(V.pv.k==='kas'&&src==='mac'&&Math.random()<0.3)return;if(V.pv.k==='bag'&&src==='ill'&&Math.random()<0.5)return;}}catch(e){}return old.apply(this,arguments);})(drCaseNew);
/* Hastalarım */
function viewV172Hst(){if(!pr172DrOn())return '<p class="muted">Bu ekran takım doktorları içindir.</p>';const j=stG(),V=pr172J(),yl=seasonLabel(G.s.year),P=pr172Pl(),S=P.filter(e=>e.y===yl),dn=S.filter(e=>e.ret!=null);
  const dev=dn.length?dn.reduce((a,e)=>a+(e.ret-(e.eta0||e.eta)),0)/dn.length:null,okN=S.filter(e=>e.ok).length,ri=S.reduce((a,e)=>a+(e.ri||0),0);
  const TRN=k=>k==='amel'?'Ameliyat':(DR_TR[k]||{}).n||k;
  const rows=P.slice(0,25).map(e=>{const D=DR_INJ[e.i]||['?'],dx=DR_INJ[e.dx],act=e.ret==null&&j.inj&&j.inj[e.k];const fark=e.ret!=null?Math.round(e.ret-(e.eta0||e.eta)):null;
    return `<div class="pr172-pt"><div class="pr172-onh"><b>${esc(e.n)}</b><small>${esc(e.y)} · ${esc(D[0])}${e.by==='asistan'?' · asistan hekim':''}</small></div>
      ${pr172Tl([[`Teşhis: ${e.ok?'doğru':'yanlış'}`,e.ok?'ok':'x'],[`Tedavi: ${TRN(e.t)}${e.t===e.id||(e.id==='agr'&&e.t==='std')?' · uygun':' · tartışmalı'}`,e.t===e.id||(e.id==='agr'&&e.t==='std')?'on':'x'],[`Tahmini dönüş · ${pr172Day(e.eta0||e.eta)}`,'on'],[e.ret!=null?`Döndü · ${pr172Day(e.ret)}`:act?`Tedavide · ${act.w} hf`:'Takip bitti',e.ret!=null?(e.ri?'x':'ok'):'wait']])}
      <small class="pr172-perf">${!e.ok&&dx?`Senin teşhisin: ${esc(dx[0])} · `:''}${fark!=null?`Gerçekleşen ${fark===0?'tahminle aynı gün':fark>0?fark+' gün geç':(-fark)+' gün erken'}`:''}${e.ri?` · ${e.ri} kez nüks`:''}${e.test?` · dönüş testi: ${{erken:'erken onay',plan:'plana sadık',bekle:'bekletildi'}[e.test.d]} (${e.test.ready?'hazırdı':'hazır değildi'})`:''}</small></div>`;}).join('');
  const dl=(V.dl||[]).slice(0,10).map(x=>`<li><span>${pr172Day(x.d)}</span><b>${esc(x.t)}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${esc(x.txt)}</small></b><em class="${x.res==='iyi'?'res-w':x.res==='kötü'?'res-l':''}">${esc(x.res)}</em></li>`).join('');
  return `<h2 class="h">Hastalarım</h2><section class="panel"><p class="sub-h"><span>${esc(yl)} sezonu</span><span>${S.length} tedavi</span></p>
    <div class="strip"><div><b>${S.length?Math.round(okN/S.length*100)+'%':'-'}</b><span>Doğru teşhis</span></div><div><b>${dn.length}</b><span>Sahaya döndü</span></div><div><b>${dev==null?'-':(dev>0?'+':'')+dec(dev,1)+' g'}</b><span>Tahmin sapması</span></div><div><b>${ri}</b><span>Nüks</span></div></div>
    <p class="muted" style="margin:6px 0 0">Her tedavi teşhisten dönüşe kadar izlenir: teşhisin doğru muydu, tedavi vakaya uygun muydu, tahmin ettiğin dönüş tarihi tuttu mu, oyuncu yeniden sakatlandı mı.</p></section>
    <section class="panel">${rows||'<p class="muted">Henüz tedavi ettiğin oyuncu yok. Muayene odasında teşhis koyup tedavi planı seçtiğinde burada izlenir.</p>'}</section>
    ${dl?`<section class="panel"><p class="sub-h"><span>Haftalık kararlarının sonuçları</span></p><ul class="cupres">${dl}</ul></section>`:''}
    ${V.rev&&V.rev.k==='dr'?pr172RevHTML():''}`;}
function pr172DrCard(){const j=stG(),V=pr172J(),yl=seasonLabel(G.s.year),P=pr172Pl().filter(e=>e.y===yl),act=pr172Pl().filter(e=>e.ret==null&&j.inj&&j.inj[e.k]).sort((a,b)=>a.eta-b.eta),last=(V.dl||[])[0];
  return `<section class="panel pr172-wkc"><p class="sub-h"><span>Sağlık özeti · ${G.s.week}. hafta</span><span>${act.length} tedavide</span></p>
    <p class="pr172-wl">${act.length?`Sıradaki dönüş: <b>${esc(act[0].n)}</b> · tahmini ${pr172Day(act[0].eta)}`:'Tedavisi süren oyuncu yok.'}${last?` · Son karar: ${esc(last.t)} (<b class="${last.res==='iyi'?'pos':last.res==='kötü'?'neg':''}">${esc(last.res)}</b>)`:''}</p>
    <div class="strip"><div><b>${j.correct||0}</b><span>Doğru teşhis</span></div><div><b>${j.wrong||0}</b><span>Yanlış teşhis</span></div><div><b>${P.filter(e=>e.ret!=null).length}</b><span>Dönen</span></div><div><b>${j.reinj||0}</b><span>Nüks</span></div></div>
    <div class="day-ctas"><button class="btn" data-act="navGo" data-tab="pr172h">Hastalarım · teşhisten dönüşe</button></div></section>`;}

/* =====================================================================
   ORTAK: hedefler, sezon değerlendirmesi, sekmeler, ana sayfa
   ===================================================================== */
stGoals=(old=>function(){const L=old.apply(this,arguments);try{const j=jobInit();if(G.staff==='scout'||G.staff==='dr'){const r0=pr172Rep0(),tg=Math.min(100,Math.max(r0+8,Math.round(r0)+1));for(const g of L)if(g[0]==='İtibar')g[2]=tg;}
    if(G.staff==='scout'){const yl=seasonLabel(G.s.year);L.splice(1,0,['Önerilen oyuncu',(j.rq||[]).filter(r=>r.y===yl).length,rqLimit()],['Sezon raporu',(j.reps||[]).filter(r=>r.y===yl).length,6]);}
    if(G.staff==='dr'){const P=pr172Pl().filter(e=>e.y===seasonLabel(G.s.year)&&e.ret!=null);L.push(['Sahaya dönen oyuncu',P.length,8]);}}catch(e){console.warn('pr172 hedef',e);}return L;})(stGoals);
staffSeasonEnd=(old=>function(){const sc=pr172ScOn(),dr=pr172DrOn();let pre=null;try{if(sc||dr){const j=stG(),yl=seasonLabel(G.s.year);pre={yl,rep0:pr172Rep0(),c:j.correct||0,w:j.wrong||0,ri:j.reinj||0,h:j.healed||0,bd:j.bd};}}catch(e){}
  const r=old.apply(this,arguments);try{if(pre)pr172StEnd(pre,sc);}catch(e){console.warn('pr172 değerlendirme',e);}return r;})(staffSeasonEnd);
function pr172StEnd(pre,sc){const j=stG(),V=pr172J(),yl=pre.yl,rows=[];let score=0;
  if(sc){const R=(j.rq||[]).filter(r=>r.y===yl),tr=R.filter(r=>r.st==='tamam'),rp=(j.reps||[]).filter(r=>r.y===yl),ok=rp.filter(r=>r.ok).length,acc=tr.filter(r=>r.real!=null),err=acc.length?acc.reduce((a,r)=>a+Math.abs(r.real-r.est),0)/acc.length:null,disc=Object.values(j.disc||{}).filter(d=>d.y===G.s.year).length;
    rows.push(['Öneri',R.length,R.length>=3?'iyi':'az'],['Gerçekleşen transfer',tr.length+ok,tr.length+ok>=2?'iyi':tr.length+ok?'orta':'zayıf'],['Görev raporu',`${rp.length} (${ok} kabul)`,rp.length>=6?'iyi':rp.length>=3?'orta':'zayıf'],['Rapor isabeti',err==null?'-':`±${dec(err,1)} güç`,err==null?'':err<=2?'iyi':err<=4?'orta':'zayıf'],['Yeni keşif',disc,disc>=3?'iyi':'orta']);
    score=R.length*2+(tr.length+ok)*8+rp.length*2+(err!=null&&err<=2?6:0)+disc*1.5;}
  else{const n=pre.c+pre.w,P=pr172Pl().filter(e=>e.y===yl),dn=P.filter(e=>e.ret!=null),dev=dn.length?dn.reduce((a,e)=>a+Math.abs(e.ret-(e.eta0||e.eta)),0)/dn.length:null,dl=(V.dl||[]),g=dl.filter(x=>x.res==='iyi').length,b=dl.filter(x=>x.res==='kötü').length;
    rows.push(['Teşhis isabeti',n?`%${Math.round(pre.c/n*100)} (${pre.c}/${n})`:'-',n?(pre.c/n>=0.75?'iyi':pre.c/n>=0.5?'orta':'zayıf'):''],['Sahaya dönen',dn.length,dn.length>=6?'iyi':'orta'],['Dönüş tahmini sapması',dev==null?'-':`${dec(dev,1)} gün`,dev==null?'':dev<=4?'iyi':dev<=10?'orta':'zayıf'],['Nüks',pre.ri,pre.ri<=1?'iyi':pre.ri<=3?'orta':'zayıf'],['Haftalık kararlar',`${g} iyi · ${b} kötü`,g>b?'iyi':b>g?'zayıf':'orta']);
    score=pre.c*3-pre.w*2-pre.ri*3+dn.length+(dev!=null&&dev<=4?5:0)+g-b*2;}
  const repD=Math.round((j.rep||0)-pre.rep0),verdict=score>=30?'Sezonun yıldızı':score>=15?'Başarılı sezon':score>=5?'Orta bir sezon':'Zayıf sezon';
  rows.push(['İtibar değişimi',`${repD>=0?'+':''}${repD}`,repD>=8?'iyi':repD>=0?'orta':'zayıf'],['Yönetim memnuniyeti',Math.round(j.bd||0),j.bd>=62?'iyi':j.bd>=45?'orta':'zayıf']);
  V.rev={k:sc?'scout':'dr',yl,rows,verdict,score:Math.round(score)};
  msg('board',`${yl} sezon değerlendirmesi: ${verdict}`,`${sc?'Gözlem':'Sağlık'} çalışmaların yönetim kurulunda değerlendirildi. ${rows.map(r=>`${r[0]}: ${r[1]}`).join(' · ')}.`);}
function pr172RevHTML(){const V=G&&G.job&&G.job.pr172,R=V&&V.rev;if(!R)return '';
  if(R.k==='ref')return `<section class="panel pr172-rev"><p class="sub-h"><span>📋 ${esc(R.yl)} · MHK sezon sonu değerlendirmesi</span><span>${R.res==='up'?'Terfi':R.res==='down'?'Düşme':'Klasmanda kaldı'}</span></p>
    <div class="strip"><div><b>${R.rank}/${R.N}</b><span>Sıra</span></div><div><b>${dec(R.pts,1)}</b><span>MHK puanı</span></div><div><b>${R.avg?dec(R.avg,2):'-'}</b><span>Not ort.</span></div><div><b>${R.marks}/4</b><span>Sicil</span></div></div>
    <p class="muted" style="margin:6px 0 0">Görevler: ${R.n.orta||0} orta hakem · ${R.n.dort||0} 4. hakem · ${R.n.var||0} VAR · ${(R.n.kupa||0)+(R.n.uefa||0)} kupa/Avrupa. Yeni klasman: <b>${esc(R.title)}</b>.</p></section>`;
  return `<section class="panel pr172-rev"><p class="sub-h"><span>📋 ${esc(R.yl)} sezon değerlendirmesi</span><span>${esc(R.verdict)}</span></p><ul class="cupres">${R.rows.map(([a,b,c])=>`<li><span>${esc(a)}</span><b>${esc(String(b))}</b><em class="${c==='iyi'?'res-w':c==='zayıf'?'res-l':''}">${esc(c||'')}</em></li>`).join('')}</ul></section>`;}
viewStaffOff=(old=>function(){let h=old.apply(this,arguments);try{if(isStaff()&&['scout','dr','ref'].includes(G.staff))h=pr172RevHTML()+h;}catch(e){}return h;})(viewStaffOff);
/* ana sayfa kartları */
viewStaffHub=(old=>function(){let h=old.apply(this,arguments);try{if(G.phase==='season'&&(pr172ScOn()||pr172DrOn())){const c=pr172ScOn()?pr172ScCard():pr172DrCard();const i=h.indexOf('<section class="panel st-board"');h=i>=0?h.slice(0,i)+c+h.slice(i):c+h;}}catch(e){console.warn('pr172 kart',e);}return h;})(viewStaffHub);
/* günlük kararlar */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'&&isStaff()&&G.job){if(isRef())pr172RefDay();else if(G.staff==='scout')pr172ScDay();else if(G.staff==='dr')pr172DrDay();}}catch(e){console.warn('pr172 gün',e);}return r;})(nextDay);
/* sekmeler: Önerilerim (gözlemci), Hastalarım (doktor) */
try{ST_PAGES.scout.push(['pr172o','Önerilerim']);ST_PAGES.dr.push(['pr172h','Hastalarım']);}catch(e){}
Object.assign(XV,{pr172o:()=>viewV172Onr(),pr172h:()=>viewV172Hst()});
XICON.pr172o=NI('<path d="M4 6h10M4 12h10M4 18h7"/><path d="M16 15l2.5 2.5L22 13"/>');XICON.pr172h=NI('<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/><path d="M9 12h6M12 9v6"/>');
NICON.pr172o=XICON.pr172o;NICON.pr172h=XICON.pr172h;
uiGroups=(old=>function(){const L=old.apply(this,arguments);try{if(!isStaff())return L;const mine=new Set(['pr172o','pr172h']),got=[];for(const [,items] of L)for(let i=items.length-1;i>=0;i--)if(mine.has(items[i][0]))got.unshift(items.splice(i,1)[0]);
    if(!got.length)return L;const gj=L.find(x=>x[0]==='Görevim');if(gj)gj[1].push(...got);else L.splice(1,0,['Görevim',got]);return L.filter(x=>x[1].length);}catch(e){return L;}})(uiGroups);
/* ---------- hakem ekranlarında kulüp kimliği görünmez (G.club yalnız takvim için içte kalır) ---------- */
msg=(old=>function(t,title,body){try{if(isRef()&&/kariyeri başlıyor/.test(String(title||''))&&typeof body==='string')body=body.replace(/Bir kulüp seç ve [^.]*\./,'Görev alacağın ligi seç ve bölgesel hakem olarak düdük çalmaya başla.');}catch(e){}const A=[...arguments];A[2]=body;return old.apply(this,A);})(msg);
v165ViewTl=(old=>function(){let h=old.apply(this,arguments);try{if(!isRef())return h;h=h.replace(/(<section class="panel v5tlh"><div>)[\s\S]*?(<\/div><div><p class="kicker">)/,'$1<span class="ref-ic pr172-tlic">🟨</span>$2');
    const seen=new Set();for(const x of G.history||[]){const cl=CLUBS[x.club];if(!cl||seen.has(cl.id))continue;seen.add(cl.id);h=h.split(`${crestSVG(cl,22)}<b>${esc(cl.name)}</b>`).join(`<span class="ref-ic">🟨</span><b>${esc(x.title||'Hakem')}</b>`);}}catch(e){console.warn('pr172 zaman',e);}return h;})(v165ViewTl);
weekStripHTML=(old=>function(){if(!isRef()||!G.s)return old.apply(this,arguments);const day=G.s.day,start=day-wdOf(today());let h='';
  for(let i=0;i<7;i++){const d=start+i,dt=dateOf(d);let t=d<0?null:dayType(d),lab=t?DT[t].s:'—',md=t==='mac'||t==='milli';
    if(t==='kupa'){const A=pr172CupAsg(d);if(A){lab='Görev';md=true;}else lab='İdman';}
    h+=`<div class="day ${[d===day?'cur':'',d<day?'past':'',md?'mday':''].join(' ')}"><span class="dn">${TR_DAYS[i]}</span><b>${dt.getUTCDate()}</b><span class="dl">${lab}</span></div>`;}
  return `<section class="week" aria-label="Bu hafta">${h}</section>`;})(weekStripHTML);
render=(old=>function(){const r=old.apply(this,arguments);try{if(isRef()){document.querySelectorAll('#view .tw-bar .tw-pill,#view .tw-bar .tw-kur,#view .tw-bar .tw-pend').forEach(e=>e.remove());}}catch(e){}return r;})(render);
try{V165_V.zaman=v165ViewTl;}catch(e){}/* görünüm tablosu eski başvuruyu tutar */
hubSideHTML=(old=>function(){let h=old.apply(this,arguments);try{if(isRef()&&h){h=h.replace(/<span>\d+\. sıra<\/span>/,`<span>${(G.s.results||[]).length}. hafta</span>`).replace(/<tr class="me"/g,'<tr class=""').replace(/<span class="msg-tag">[^<]*<\/span>(<b>(?:MHK|Kural semineri|Haftanın gözlem|Klasman)[^<]*<\/b>)/g,'<span class="msg-tag">MHK</span>$1').split('<span class="msg-tag">'+(TAGS.board||'YÖN')+'</span>').join('<span class="msg-tag">MHK</span>');}}catch(e){}return h;})(hubSideHTML);
render=(old=>function(){const r=old.apply(this,arguments);try{if(isRef())document.querySelectorAll('#view tr.me,#view li.me').forEach(e=>e.classList.remove('me'));}catch(e){}return r;})(render);
