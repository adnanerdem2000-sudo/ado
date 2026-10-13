/* ================= v28: gözlemci rapor formu, profilde sezon istatistikleri, personel maç sonucu (golcüler + reytingler) ================= */
/* ---------- gözlemci raporu ---------- */
const SR_ROLES=['Yıldız','İlk 11','Rotasyon','Gelecek vaat eden','Yedek'],SR_REC=[['kesin','Kesinlikle alınmalı'],['al','Alınmalı'],['izle','Takip edilmeli']];
const SR_CAT={Hız:['Hız','Hızlanma'],Teknik:['Dripling','Teknik','İlk Kontrol'],Fizik:['Güç','Dayanıklılık','Denge'],Pas:['Pas','Vizyon'],Bitiricilik:['Bitiricilik','Uzaktan Şut','Soğukkanlılık'],Savunma:['Markaj','Top Kapma','Pozisyon Alma'],Zihinsel:['Karar Alma','Konsantrasyon','Kararlılık'],'Hava topu':['Kafa Vuruşu','Zıplama']};
const SR_CATG={Refleks:['Refleks','Çeviklik'],'Bire bir':['Bire Bir','Kaleden Çıkma'],'Hava hakimiyeti':['Hava Hakimiyeti','Zıplama'],'Oyun kurma':['Ayakla Oyun','Pas','Topu Oyuna Sokma'],Zihinsel:['Konsantrasyon','Karar Alma','Soğukkanlılık'],İletişim:['İletişim','Liderlik']};
let SRF=null;
function srTruth(p){const A=fmAttrs(p),cats=p.pos==='KL'?SR_CATG:SR_CAT,sc=Object.entries(cats).map(([k,L])=>[k,L.reduce((a,n)=>a+(to20(A.raw[n]||40)),0)/L.length]).sort((a,b)=>b[1]-a[1]),me=myClub(),d=p.ovr-me.str,pt=potOf(p);
  const role=d>=4?'Yıldız':d>=-1?'İlk 11':d>=-6?'Rotasyon':(p.age<=21&&pt>=me.str?'Gelecek vaat eden':'Yedek');
  return {ca:Math.round(clamp((p.ovr-45)/9,0.5,5)*2)/2,pa:Math.round(clamp((pt-45)/9,0.5,5)*2)/2,role,strong:sc[0][0],weak:sc[sc.length-1][0],fee:pValue(p),cats:Object.keys(cats)};}
function srOpen(k,kind){const p=pByKey(k);if(!p)return;const [lo,hi]=scRange(p,'o'),[pl,ph]=scRange(p,'p'),T=srTruth(p);SRF={k,kind,role:'İlk 11',ca:Math.round(clamp(((lo+hi)/2-45)/9,0.5,5)*2)/2,pa:Math.round(clamp(((pl+ph)/2-45)/9,0.5,5)*2)/2,fee:rnd5(T.fee*(0.85+Math.random()*0.3),stepOf(T.fee)),rec:'al',strong:null,weak:null};srModal();}
function srModal(){const F=SRF,p=pByKey(F.k);if(!p)return;const cid=scCid(p),c=CLUBS[cid],T=srTruth(p),acc=scAcc(p),cats=T.cats;
  const stars=(f,v)=>`<div class="sr-st"><button class="btn sm" data-act="srS" data-f="${f}" data-k="-0.5">−</button>${fmStars(v)}<b>${v.toFixed(1)}</b><button class="btn sm" data-act="srS" data-f="${f}" data-k="0.5">+</button></div>`;
  openModal(`<div class="ng sr"><p class="sub-h"><span>${F.kind==='rep'?'Görev raporu':'Transfer talebi raporu'}</span><span>Bilgi seviyesi ${knDots(acc)}</span></p>
   <div class="ng-hd"><div class="ng-face" data-act="pcard" data-id="${cid}" data-k="${p.k}">${faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num})}</div><div class="ng-id"><b><span class="plink" data-act="pcard" data-id="${cid}" data-k="${p.k}">${esc(p.name)}</span></b><small>${POS_TR[p.pos]} · ${p.age} yaş · ${flagImg(p.nat,'fl-row')} ${esc(natName(p.nat))}</small><small>${crestSVG(c,14)} ${esc(c.name)}</small></div><div class="ng-ovr"><b>${R200(scO(p,c))}</b><small>tahmini güç</small></div></div>
   <p class="ng-l">Kadroda önerdiğin rol</p><div class="seg2 wrap">${SR_ROLES.map(r=>`<button class="chip" data-act="srS" data-f="role" data-k="${r}" aria-pressed="${F.role===r}">${r}</button>`).join('')}</div>
   <div class="sr-two"><div><p class="ng-l">Mevcut yetenek puanı</p>${stars('ca',F.ca)}</div><div><p class="ng-l">Potansiyel puanı</p>${stars('pa',F.pa)}</div></div>
   <p class="ng-l">Önerdiğin bonservis</p><div class="ng-stp"><button class="btn" data-act="srS" data-f="fee" data-k="-1">−</button><b>${eur(F.fee)}</b><button class="btn" data-act="srS" data-f="fee" data-k="1">+</button></div>
   <p class="ng-l">En güçlü yönü</p><div class="seg2 wrap">${cats.map(x=>`<button class="chip" data-act="srS" data-f="strong" data-k="${x}" aria-pressed="${F.strong===x}">${x}</button>`).join('')}</div>
   <p class="ng-l">En zayıf yönü</p><div class="seg2 wrap">${cats.map(x=>`<button class="chip" data-act="srS" data-f="weak" data-k="${x}" aria-pressed="${F.weak===x}">${x}</button>`).join('')}</div>
   <p class="ng-l">Tavsiyen</p><div class="seg2">${SR_REC.map(([k,l])=>`<button class="chip" data-act="srS" data-f="rec" data-k="${k}" aria-pressed="${F.rec===k}">${l}</button>`).join('')}</div>
   <p class="muted" style="margin:8px 0">Raporun teknik heyet tarafından oyuncunun gerçek değerleriyle karşılaştırılacak. Doğru raporlar yönetimin güvenini ve yeteneğini artırır; abartılı ya da yanlış raporlar güveni sarsar.</p>
   <button class="cta" data-act="srGo" ${F.strong&&F.weak?'':'disabled'}>Raporu yönetime sun</button><button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:6px">Vazgeç</button></div>`);$('#modalCard').classList.add('wide');}
ACTX.srS=el=>{const F=SRF;if(!F)return;const f=el.dataset.f,k=el.dataset.k;if(f==='ca'||f==='pa')F[f]=clamp(F[f]+(+k),0.5,5);else if(f==='fee'){const st=stepOf(F.fee);F.fee=Math.max(st,rnd5(F.fee+(+k)*st,st));}else F[f]=k;srModal();};
function srScore(F,p){const T=srTruth(p),ri=r=>SR_ROLES.indexOf(r),rd=Math.min(2,Math.abs(ri(F.role)-ri(T.role))),fe=Math.abs(F.fee-T.fee)/Math.max(1,T.fee);
  const acc=clamp(Math.round(100-Math.abs(F.ca-T.ca)*16-Math.abs(F.pa-T.pa)*12-rd*12-Math.min(30,fe*40)-(F.strong===T.strong?0:9)-(F.weak===T.weak?0:9)),0,100);return {acc,T};}
ACTX.srGo=()=>{const F=SRF;if(!F||!F.strong||!F.weak)return;const p=pByKey(F.k);if(!p)return;const {acc,T}=srScore(F,p),j=stG();closeModal();
  if(F.kind==='rep'&&(!j.task||j.task.done))return toast('Aktif gözlem görevin yok');const before=(j.rq||[]).length;if(F.kind==='rep')scReport(F.k);else scRequest(F.k);
  const r=(j.rq||[]).find(x=>x.k===F.k&&x.st==='bekliyor');if(r){r.rep={role:F.role,ca:F.ca,pa:F.pa,fee:F.fee,rec:F.rec,acc};}
  if(F.kind!=='rep'&&!r&&(j.rq||[]).length===before)return;
  (j.srLog=j.srLog||[]).unshift({n:p.name,y:seasonLabel(G.s.year),acc,role:F.role,tr:T.role,ca:F.ca,tca:T.ca});if(j.srLog.length>15)j.srLog.length=15;
  stBoard((acc-60)/7);stGrow((acc-55)/22);j.rep=clamp(j.rep+(acc-60)/18,0,100);if(acc>=75)netXP(4);
  msg('scout','Rapor değerlendirmesi',`Teknik heyet ${p.name} raporunu inceledi: doğruluk %${acc}. ${acc>=80?'Çok isabetli bir rapor; yönetimin sana güveni arttı.':acc>=60?'Genel olarak doğru bir rapor.':acc>=40?'Bazı değerlendirmelerin gerçeği yansıtmıyor.':'Rapor gerçeklerden çok uzak; yönetim güveni sarsıldı.'} Heyetin değerlendirmesi: rol ${T.role}, yetenek ${T.ca.toFixed(1)}★, potansiyel ${T.pa.toFixed(1)}★, en güçlü yön ${T.strong}, en zayıf yön ${T.weak}.`);
  toast(`Rapor sunuldu · doğruluk %${acc}`);save();render();};
rqResolve=(old=>function(r){const j=jobInit();if(r.rep){const b=(r.rep.acc-60)/250+(r.rep.rec==='kesin'?0.05:r.rep.rec==='izle'?-0.08:0);j.rep=clamp(j.rep+b*100,0,100);old(r);j.rep=clamp(j.rep-b*100,0,100);return;}return old(r);})(rqResolve);
ACTX.scRq=el=>srOpen(el.dataset.k,'rq');ACTX.scRqM=el=>{closeModal();srOpen(el.dataset.k,'rq');};ACTX.scRep=el=>srOpen(el.dataset.k,'rep');
/* ---------- sezon istatistikleri ---------- */
function pstOf(){G.s.pst=G.s.pst||{};return G.s.pst;}
function pstAdd(k,o){const S=pstOf(),x=S[k]=S[k]||{ap:0,st:0,mn:0,rt:0,g:0,a:0,yc:0,rc:0,cs:0};x.ap++;if(o.st)x.st++;x.mn+=o.mn||0;x.rt+=o.rt||0;x.g+=o.g||0;x.a+=o.a||0;x.yc+=o.yc||0;x.rc+=o.rc||0;x.cs+=o.cs||0;}
function seasonStats(p,cid){const S=G.s,c=CLUBS[cid];if(!S||!c)return null;const tr=S.pst&&S.pst[p.k];
  let played=0;try{const tb=cid&&c.league===S.league?table():tableOf(c.league,olSync(c.league).res);const row=tb.find(x=>x.id===cid);played=row?row.o:0;}catch(e){}
  const r=srng(p.k+'ss'+S.year);r();r();const sq=squadOf(cid),xi=autoXI(sq),bench=sq.filter(q=>!xi.includes(q.k)).sort((a,b)=>b.ovr-a.ovr).slice(0,7).map(q=>q.k);
  let ap,st;if(xi.includes(p.k)){ap=Math.round(played*(0.8+0.18*r()));st=Math.max(0,ap-Math.round(r()*3));}else if(bench.includes(p.k)){ap=Math.round(played*(0.25+0.35*r()));st=Math.round(ap*0.3*r());}else{ap=Math.round(played*0.1*r());st=0;}
  const ps=S.ps&&S.ps[p.k],gr={FW:0.42,KN:0.24,OS:0.12,DF:0.04,KL:0}[p.pos]*(0.6+r()*0.8)*Math.max(0.4,1+(p.ovr-c.str)/12);
  const g=c.league===S.league&&ps?ps.g:Math.round(ap*gr*(st/Math.max(1,ap)*0.7+0.3)),a=c.league===S.league&&ps?ps.a:Math.round(ap*gr*0.7*(0.5+r()));
  const rt=ap?clamp(6.55+(p.ovr-c.str)*0.04+(g*0.12+a*0.07)/Math.max(1,ap)*3+(r()-0.5)*0.4,5.8,8.6):0;
  const est={ap,st,mn:st*84+(ap-st)*22,rt:rt*ap,g,a,yc:Math.round(ap*(p.pos==='DF'?0.18:0.1)*r()*1.6),rc:r()<0.06?1:0,cs:p.pos==='KL'?Math.round(st*(0.2+0.25*r())):0};if(tr&&cid===G.club&&tr.ap>=est.ap*0.6)return Object.assign({tracked:1},tr,c.league===S.league&&ps?{g:Math.max(tr.g,ps.g),a:Math.max(tr.a,ps.a)}:{});return est;}
fmProfHTML=(old=>function(p,c,opt){const h=old(p,c,opt);if(opt&&opt.acad)return h;let s=null;try{s=seasonStats(p,c.id);}catch(e){}if(!s)return h;
  const avg=s.ap?(s.rt/s.ap).toFixed(2):'–',cell=(l,v)=>`<div><b>${v}</b><span>${l}</span></div>`;
  const blk=`<p class="fmp-sec">Sezon istatistikleri · ${seasonLabel(G.s.year)} <small>· ${esc(LEAGUES[c.league].short)}${s.tracked?'':' · tahmini'}</small></p><div class="fmp-ss">${cell('Maç',`${s.ap}<small> (${s.st})</small>`)}${p.pos==='KL'?cell('Gol yemeden',s.cs):cell('Gol',s.g)}${cell('Asist',s.a)}${cell('Ort. reyting',avg)}${cell('Dakika',s.mn)}${cell('Sarı kart',s.yc)}${cell('Kırmızı',s.rc)}${cell('Gol / maç',s.ap?(s.g/s.ap).toFixed(2):'0')}</div>`;
  return h.replace('<p class="fmp-sec">Özellikler',blk+'<p class="fmp-sec">Özellikler');})(fmProfHTML);
/* 2B maçta kendi takımının istatistiklerini kaydet */
fxClose=(old=>function(){const S=FX;try{if(S&&!S.watch&&G.mode==='mgr'&&S.phase==='end'){const ga=S.score[1];for(const p of S.U.P){const mn=Math.round(((p.offT!=null?p.offT:S.t)-(p.onT||0))/60);if(p.subbed&&!(p.s.pa>0)&&!p.s.g)continue;pstAdd(p.k,{st:!p.onT,mn:Math.max(1,Math.min(95,mn||90)),rt:fxR(p),g:p.s.g||0,a:p.s.as||0,yc:p.yel?1:0,rc:p.red?1:0,cs:p.spos==='KL'&&ga===0?1:0});}}}catch(e){}return old();})(fxClose);
/* ---------- personel: maç sonucu ekranı (golcüler + reytingler) ---------- */
function stMatchSheet(f,hg,ag,goals,notes){const H=CLUBS[f[0]],A=CLUBS[f[1]],r=srnd(f[0]+f[1]+G.s.year+'ms'+G.s.week);
  const team=(id,gf,ga,win,draw)=>{const sq=squadOf(id),xi=autoXI(sq).map(k=>sq.find(q=>q.k===k)).filter(Boolean),avg=xi.reduce((a,p)=>a+p.ovr,0)/Math.max(1,xi.length);
    return xi.map(p=>{const g=goals.filter(x=>x.k===p.k).length,a=goals.filter(x=>x.ak===p.k).length;let rt=6.5+(win?0.35:draw?0:-0.35)+g*0.9+a*0.5+(p.ovr-avg)*0.03+(r()-0.5)*0.9;
      if(p.pos==='KL')rt+=ga===0?0.6:-ga*0.25;if(p.pos==='DF')rt+=ga===0?0.3:-ga*0.12;return {p,g,a,rt:clamp(Math.round(rt*10)/10,4.5,10)};}).sort((x,y)=>['KL','DF','OS','KN','FW'].indexOf(x.p.pos)-['KL','DF','OS','KN','FW'].indexOf(y.p.pos));};
  const TH=team(f[0],hg,ag,hg>ag,hg===ag),TA=team(f[1],ag,hg,ag>hg,hg===ag),all=TH.concat(TA),motm=all.slice().sort((a,b)=>b.rt-a.rt)[0];
  for(const [T,id] of [[TH,f[0]],[TA,f[1]]])if(id===G.club)for(const x of T)pstAdd(x.p.k,{st:1,mn:90,rt:x.rt,g:x.g,a:x.a,cs:x.p.pos==='KL'&&(id===f[0]?ag:hg)===0?1:0});
  const gl=goals.slice().sort((a,b)=>a.m-b.m).map(x=>`<li class="${x.side?'r':''}"><i>${x.m}’</i>⚽ <span class="plink" data-act="pcard" data-id="${x.cid}" data-k="${x.k}">${esc(x.n)}</span>${x.an?` <small>(asist: ${esc(x.an)})</small>`:''}</li>`).join('');
  const col=(T,c)=>`<div class="ms-col"><p class="sub-h"><span>${crestSVG(c,16)} ${esc(c.short)}</span><span>Reyting</span></p>${T.map(x=>`<div class="ms-r${x===motm?' motm':''}"><span>${x.p.pos}</span><b class="plink" data-act="pcard" data-id="${c.id}" data-k="${x.p.k}">${esc(x.p.name)}</b><small>${'⚽'.repeat(x.g)}${x.a?' 🅰'.repeat(x.a):''}</small><em class="${x.rt>=7.5?'hi':x.rt<6?'lo':''}">${x.rt.toFixed(1)}</em></div>`).join('')}</div>`;
  openModal(`<h3>Maç sonucu</h3><div class="res-board"><div class="team">${crestSVG(H,38)}<b>${esc(H.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(A,38)}<b>${esc(A.name)}</b></div></div>
   ${gl?`<ul class="ms-goals">${gl}</ul>`:'<p class="muted" style="text-align:center">Golsüz maç</p>'}<p class="ms-motm">⭐ Maçın oyuncusu: <b>${esc(motm.p.name)}</b> · ${motm.rt.toFixed(1)}</p>
   <div class="ms-cols">${col(TH,H)}${col(TA,A)}</div>${notes}<button class="cta" data-act="closeModal">Devam</button>`);$('#modalCard').classList.add('wide');}
function stGoalsFrom(f,hg,ag,before){const r=srnd(f.join('')+G.s.year+'gm'+G.s.week),goals=[];
  for(const [side,id,n] of [[0,f[0],hg],[1,f[1],ag]]){const sq=squadOf(id),xi=autoXI(sq).map(k=>sq.find(q=>q.k===k)).filter(Boolean);let gs=[],as=[];
    if(before){for(const p of sq){const b=before[p.k],a=G.s.ps&&G.s.ps[p.k];if(!a)continue;for(let i=0;i<(a.g-(b?b.g:0));i++)gs.push(p);for(let i=0;i<(a.a-(b?b.a:0));i++)as.push(p);}}
    while(gs.length<n){const pool=xi.filter(p=>p.pos!=='KL');gs.push(wpick(pool.map(p=>[p,GWP[p.pos]*Math.max(0.3,(p.ovr-60)/10)])));}gs=gs.slice(0,n);
    gs.forEach((p,i)=>{const ap=as[i]&&as[i].k!==p.k?as[i]:(r()<0.7?pick(xi.filter(q=>q.k!==p.k&&q.pos!=='KL')):null);goals.push({side,cid:id,k:p.k,n:p.name,ak:ap?ap.k:null,an:ap?ap.name:null,m:1+Math.floor(r()*93)});});}
  return goals;}
staffMatch=(old=>function(){const f=ourFixture();if(!f||!isStaff())return old();const before={};for(const [k,v] of Object.entries(G.s.ps||{}))if(v.c===f[0]||v.c===f[1])before[k]={g:v.g,a:v.a};
  const wk=G.s.week;old();const rd=G.s.results[wk-1],res=rd&&rd.find(x=>x[0]===f[0]&&x[1]===f[1]);if(!res)return;const mc=$('#modalCard'),notes=mc?(mc.querySelector('ul.notes')||{}).outerHTML||'':'';
  const goals=stGoalsFrom(f,res[2],res[3],before);stMatchSheet(f,res[2],res[3],goals,notes);save();})(staffMatch);
staffCup=(old=>function(){const cu=cupToday();if(!cu||!isStaff())return old();const k=cu.c,n0=k.res.length;old();const x=k.res[n0];if(!x)return;const mc=$('#modalCard'),notes=mc?(mc.querySelector('ul.notes')||{}).outerHTML||'':'';
  if(!CLUBS[x.opp])return;const f=x.h?[G.club,x.opp]:[x.opp,G.club],hg=x.h?x.us:x.them,ag=x.h?x.them:x.us;stMatchSheet(f,hg,ag,stGoalsFrom(f,hg,ag,null),notes);})(staffCup);

