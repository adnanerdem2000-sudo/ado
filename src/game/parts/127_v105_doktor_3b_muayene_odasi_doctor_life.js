/* ================= v105: doktor — 3B muayene odası (Doctor Life Simulator esintili) =================
   Hasta futbolcu kapıdan girer, adı başının üstünde yazar, muayene masasına oturur. Akış: Şikâyet (anamnez) → Fizik muayene (vücut haritası, ateş, dinleme, hareket testi)
   → Tetkik (röntgen, ultrason, MR, kan; ekipmanın yoksa hastaneye sevk: para ve zaman) → Teşhis → Tedavi. Süre ve hasta memnuniyeti izlenir. */
/* her vaka için bulgular: [bölge, ateş, elle muayene, hareket testi, dinleme, en iyi tetkik, tetkik sonucu, ne zaman/nasıl] */
const DROX=[
 ['uyluk_arka',36.7,'Uyluk arkasında noktasal hassasiyet, hafif çukurlaşma','Düz bacak kaldırma testinde 50°’de keskin ağrı','Kalp ve akciğer sesleri doğal','ultra','Ultrason: arka adalede 2. derece gerilme, kas içinde sıvı','Maçta sprint atarken, uyluğumun arkası birden battı.'],
 ['ayak_bilegi',36.8,'Dış bilek bağlarında şişlik ve morarma','Ön çekmece testi hafif pozitif','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: kırık yok, yumuşak doku şişliği','İkili mücadelede ayağım içe döndü.'],
 ['diz',36.7,'Diz eklem aralığının iç tarafında hassasiyet','McMurray testi pozitif: klik sesi ve ağrı','Kalp ve akciğer sesleri doğal','mr','MR: iç menisküs arka boynuzunda yırtık','Dönerken dizim kilitlendi gibi oldu.'],
 ['diz',36.9,'Dizde belirgin sıvı birikimi','Lachman testi pozitif: kaval kemiği öne kayıyor','Kalp ve akciğer sesleri doğal','mr','MR: ön çapraz bağ tam kat kopuk','Ani yön değiştirdim, dizimden “pop” diye bir ses geldi.'],
 ['kasik',36.7,'Kasık iç tarafında, adduktor kaslarda hassasiyet','Bacakları sıkıştırma testinde ağrı','Kalp ve akciğer sesleri doğal','ultra','Ultrason: adduktor kasında gerilme','Ani yön değiştirirken kasığım çekti.'],
 ['baldir',36.7,'Baldırda sertlik ve noktasal ağrı','Parmak ucunda yükselme yapamıyor','Kalp ve akciğer sesleri doğal','ultra','Ultrason: baldır kasında kısmi yırtık','Koşarken baldırıma taş çarpmış gibi oldu.'],
 ['bas',36.8,'Başta şişlik, ense hassasiyeti yok','Denge testi bozuk, göz takibinde gecikme','Kalp ve akciğer sesleri doğal','mr','MR: kanama yok; bulgular beyin sarsıntısıyla uyumlu','Kafa kafaya çarpıştık, sonrası biraz bulanık.'],
 ['gogus',36.8,'Göğüs yan duvarında noktasal hassasiyet','Derin nefes almakta zorlanıyor','Solunum sesleri doğal, derin nefeste ağrı','rontgen','Röntgen: 8. kaburgada çatlak','Rakibin dizi göğüs yanıma geldi.'],
 ['ayak_bilegi',36.7,'Aşil tendonunda kalınlaşma ve hassasiyet','Thompson testi negatif (tendon kopuk değil)','Kalp ve akciğer sesleri doğal','ultra','Ultrason: aşil tendonunda kalınlaşma, tendinit','Haftalardır sabahları topuğumun arkası tutuk.'],
 ['uyluk_on',36.7,'Ön uylukta hassasiyet','Dirence karşı dizi uzatırken ağrı','Kalp ve akciğer sesleri doğal','ultra','Ultrason: ön uyluk kasında gerilme','Şut atarken ön uyluğum çekti.'],
 ['bogaz',38.9,'Yaygın kas hassasiyeti','Hareket testleri normal, halsiz','Akciğer sesleri doğal, burun tıkalı','lab','Hızlı test: influenza A pozitif','İki gündür titriyorum, her yerim ağrıyor.'],
 ['karin',37.8,'Karında yaygın hassasiyet, bağırsak sesleri artmış','Hareket testleri normal','Kalp sesleri doğal, nabız hızlı','lab','Kan ve dışkı: viral gastroenterit','Dün geceden beri kusuyorum.'],
 ['bogaz',39.1,'Boyunda lenf bezleri şiş','Hareket testleri normal','Akciğer sesleri doğal','lab','Boğaz kültürü: streptokok pozitif','Üç gündür yutkunamıyorum.'],
 ['bas',36.7,'Ense kaslarında gerginlik','Nörolojik muayene normal','Kalp ve akciğer sesleri doğal','mr','MR: yapısal bir sorun yok','Sabahtan beri başımın bir tarafı zonkluyor, ışık rahatsız ediyor.'],
 ['baldir',37.3,'Baldırda kasılma, cilt kuru','Hareket testleri normal, yorgun','Nabız hızlı','lab','Kan: sodyum düşük, sıvı kaybı','Maçın son dakikalarında baldırım kasıldı kaldı.'],
 ['bel',36.7,'Bel kaslarında spazm','Öne eğilmede belirgin kısıtlılık','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: kemik yapı normal, kas spazmı','Eğilirken belim tutuldu.'],
 ['uyluk_on',36.8,'Uylukta sert şişlik ve morarma','Dizini 90° bükemiyor','Kalp ve akciğer sesleri doğal','ultra','Ultrason: kas içi kan birikimi (hematom)','Rakibin dizi uyluğuma çarptı.'],
 ['yuz',36.8,'Burun kemiğinde hassasiyet, şekil bozukluğu','Hareket testleri normal','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: burun kemiği kırığı','Hava topunda dirsek yedim.'],
 ['ayak',36.8,'Ayak parmağında şişlik ve morarma','Basarken keskin ağrı','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: parmak kemiğinde kırık','Biri kramponla parmağıma bastı.'],
 ['ayak',36.7,'Topuğun iç-alt tarafında hassasiyet','Sabah ilk adımda ağrı tarif ediyor','Kalp ve akciğer sesleri doğal','ultra','Ultrason: ayak tabanı zarında kalınlaşma','Haftalardır sabahları topuğum yanıyor.'],
 ['omuz',36.8,'Omuz başı yerinde değil, omuz hattı düzleşmiş','Kolunu kaldıramıyor','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: omuz ön çıkığı','Düşerken kolumun üstüne geldim.'],
 ['yuz',37.9,'Çenede şişlik, dişe vurunca ağrı','Hareket testleri normal','Kalp ve akciğer sesleri doğal','rontgen','Diş röntgeni: kök ucunda apse','Birkaç gündür dişim zonkluyor.'],
 ['yuz',36.8,'Göz çevresinde morarma','Göz hareketleri ağrılı ama tam','Kalp ve akciğer sesleri doğal','rontgen','Röntgen: göz çukurunda kırık yok','Top yüzüme sert çarptı.'],
 ['ayak',36.7,'Ayak üstünde noktasal kemik hassasiyeti','Zıplarken ağrı','Kalp ve akciğer sesleri doğal','mr','MR: 5. tarak kemiğinde stres kırığı','Haftalardır koşunun sonuna doğru ayağım ağrıyor.']];
const DROREG={bas:'Baş',yuz:'Yüz',bogaz:'Boğaz',omuz:'Omuz',gogus:'Göğüs',karin:'Karın',bel:'Bel',kasik:'Kasık',uyluk_on:'Ön uyluk',uyluk_arka:'Arka uyluk',diz:'Diz',baldir:'Baldır',ayak_bilegi:'Ayak bileği',ayak:'Ayak'};
const DROT={rontgen:['Röntgen','dr_rontgen','bone'],ultra:['Ultrason','dr_ultra','lens'],mr:['MR','dr_mr','chart'],lab:['Kan tahlili','dr_lab','syringe']};
const DRO={on:false};
function droCase(){const j=stG();return j.cases.find(c=>c.k===DRO.k&&!c.done)||null;}
function droIdx(){const j=stG();return j.cases.findIndex(c=>c.k===DRO.k);}
ACTX.drRoom=el=>{const j=stG();const cs=el&&el.dataset.c!=null?j.cases[+el.dataset.c]:j.cases.find(c=>c.step===0);if(!cs)return toast('Bekleyen hasta yok');droOpen(cs);};
function droOpen(cs){const p=pByKey(cs.k)||{name:cs.name,k:cs.k,nat:'TUR',age:25,num:7,pos:'OS'};
  Object.assign(DRO,{on:true,k:cs.k,p,step:cs.step===1?'tx':'sk',min:0,sat:100,found:[],asked:{},did:{},say:null,walk:0,xray:null});
  let el=$('#drOffice');if(!el){el=document.createElement('div');el.id='drOffice';document.body.appendChild(el);el.addEventListener('click',e=>droClick(e));}
  el.hidden=false;document.documentElement.classList.add('dro-on');droRender();setTimeout(()=>{DRO.walk=1;droPos();DRO.say=pick(['Merhaba hocam.','Hocam, size bir bakmanız gerek.','Günaydın doktor bey.']);droBubble();},80);
  setTimeout(()=>{DRO.walk=2;droPos();},1500);}
function droClose(){DRO.on=false;const el=$('#drOffice');if(el){el.hidden=true;el.innerHTML='';}document.documentElement.classList.remove('dro-on');try{render();}catch(e){}}
function droFind(t,cls){DRO.found.push([t,cls||''] );}
function droTime(m){DRO.min+=m;if(DRO.min>35)DRO.sat=Math.max(0,DRO.sat-m*1.4);}
/* ---------- sahne ---------- */
function droPatientSVG(){const p=DRO.p,c=CLUBS[G.club]||{c1:'#1f6feb',c2:'#fff'};let face='';try{face=faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num});}catch(e){face='';}
  return `<div class="dro-pt-face">${face}</div><svg class="dro-pt-legs" viewBox="0 0 60 70"><rect x="12" y="0" width="36" height="20" rx="4" fill="${c.c2||'#fff'}"/><rect x="15" y="20" width="11" height="34" rx="4" fill="#e9c6a5"/><rect x="34" y="20" width="11" height="34" rx="4" fill="#e9c6a5"/><rect x="14" y="40" width="13" height="22" rx="3" fill="${c.c1||'#1f6feb'}"/><rect x="33" y="40" width="13" height="22" rx="3" fill="${c.c1||'#1f6feb'}"/><rect x="12" y="60" width="16" height="7" rx="3" fill="#111"/><rect x="32" y="60" width="16" height="7" rx="3" fill="#111"/></svg>`;}
function droDocSVG(){let face='';try{const lk=G.p.look||lookOf('me-dr','TUR',G.p.age||40,true);face=faceSVG(lk,{coach:true,c1:'#f4f7fa',c2:'#6fa8dc',age:G.p.age||40});}catch(e){}return `<div class="dro-pt-face">${face}</div>`;}
function droBox(cls,w,h,d,x,y,z,inner){/* küp: üst, ön, sol, sağ yüzler */
  return `<div class="dro-box ${cls}" style="transform:translate3d(${x}px,${y}px,${z}px)"><div class="f dro-ft" style="width:${w}px;height:${d}px;transform:translate3d(${-w/2}px,${-h-d/2}px,0) rotateX(90deg)"></div><div class="f dro-ff" style="width:${w}px;height:${h}px;transform:translate3d(${-w/2}px,${-h}px,${d/2}px)">${inner||''}</div><div class="f dro-fs" style="width:${d}px;height:${h}px;transform:translate3d(${-d/2}px,${-h}px,0) translateX(${-w/2}px) rotateY(-90deg)"></div><div class="f dro-fs dro-fr" style="width:${d}px;height:${h}px;transform:translate3d(${-d/2}px,${-h}px,0) translateX(${w/2}px) rotateY(90deg)"></div></div>`;}
function droScene(){const p=DRO.p,c=CLUBS[G.club]||{},cs=droCase();const xr=DRO.xray;
  return `<div class="dro-scene"><div class="dro-cam"><div class="dro-room">
    <div class="pl dro-wb"><div class="dro-win"><i></i></div><div class="dro-xr ${xr?'on':''}">${xr?`<b>${esc(xr)}</b>`:'<span>Görüntü yok</span>'}</div><div class="dro-dip"><i></i><i></i></div><div class="dro-clock">${String(9+Math.floor(DRO.min/60)).padStart(2,'0')}:${String(DRO.min%60).padStart(2,'0')}</div><div class="dro-sign">${esc(c.short||'')} Sağlık Merkezi</div></div>
    <div class="pl dro-wl"><div class="dro-door"></div><div class="dro-cab"></div></div>
    <div class="pl dro-wr"><div class="dro-shelf"><i></i><i></i><i></i></div><div class="dro-sink"></div></div>
    <div class="pl dro-wf"></div>
    ${droBox('bed',230,62,96,120,180,-60,'<span class="pillow"></span>')}
    ${droBox('desk',190,74,90,-170,180,40,'')}<div class="dro-mon" style="transform:translate3d(-118px,106px,30px) rotateY(18deg)"><b>${esc(p.name)}</b><small>${esc(c.name||'')} · ${p.pos||''} · ${p.age||''} yaş</small><small>${cs?(cs.src==='ill'?'İdman öncesi şikâyet':'Maç sonrası'):''}</small></div>
    <div class="dro-doc" style="transform:translate3d(-225px,180px,-55px)">${droDocSVG()}<span class="dro-tag doc">Dr. ${esc((G.p.name||'').split(' ').slice(-1)[0]||'')}</span></div>
    <div class="dro-pt" id="droPt" style="transform:${droP3()}">${droPatientSVG()}<span class="dro-tag">${esc(p.name)}</span><div class="dro-say" id="droSay" hidden></div></div>
  </div></div></div>`;}
function droP3(){const pos=DRO.walk===0?[-330,180,-200]:DRO.walk===1?[-120,180,-60]:[10,180,40];return `translate3d(${pos[0]}px,${pos[1]}px,${pos[2]}px)`;}
function droPos(){const el=$('#droPt');if(!el)return;const pos=DRO.walk===0?[-330,180,-200]:DRO.walk===1?[-120,180,-60]:[10,180,40];el.style.transform=`translate3d(${pos[0]}px,${pos[1]}px,${pos[2]}px)`;el.classList.toggle('walk',DRO.walk===1);}
function droBubble(){const b=$('#droSay');if(!b)return;if(!DRO.say){b.hidden=true;return;}b.textContent=DRO.say;b.hidden=false;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
/* ---------- arayüz ---------- */
const DRO_STEPS=[['sk','Şikâyet'],['mu','Muayene'],['tt','Tetkik'],['dx','Teşhis'],['tx','Tedavi']];
function droQs(cs){const D=DR_INJ[cs.i],X=DROX[cs.i]||[];return [['ne','Şikâyetin ne?',()=>(cs.sym||D[1])[0]+'.'],['nasil','Nasıl oldu?',()=>X[7]||'Tam hatırlamıyorum.'],['nerede','Tam olarak neren ağrıyor?',()=>X[0]?`${DROREG[X[0]]} bölgem.`+((cs.sym||D[1])[1]?' '+(cs.sym||D[1])[1]+'.':''):'Her yerim.'],['ates','Ateşin ya da halsizliğin var mı?',()=>X[1]>=37.5?'Evet, titriyorum, halsizim.':'Hayır, ateşim yok.'],['once','Daha önce böyle bir şey yaşadın mı?',()=>Math.random()<.4?'Geçen sezon benzer bir şey olmuştu.':'Hayır, ilk kez.'],['devam','Oynamaya devam edebildin mi?',()=>(cs.sym||D[1])[2]?(cs.sym||D[1])[2]+'.':'Zorlandım.']];}
function droUI(){const cs=droCase();if(!cs)return `<div class="dro-ui"><p>Vaka kapandı.</p><button class="cta" data-dro="close">Odadan çık</button></div>`;
  const step=DRO.step,tabs=DRO_STEPS.map(([k,n],i)=>`<button type="button" class="dro-tab${step===k?' on':''}" data-dro="tab:${k}" ${cs.step===1&&k!=='tx'?'disabled':''}>${i+1}. ${n}</button>`).join('');
  let body='';
  if(step==='sk'){body=`<p class="dro-h">Hastaya sor <small>(her soru 3 dk)</small></p><div class="dro-acts">${droQs(cs).map(([k,q])=>`<button type="button" data-dro="q:${k}" ${DRO.asked[k]?'disabled':''}>${q}</button>`).join('')}</div>`;}
  else if(step==='mu'){const X=DROX[cs.i]||[];body=`<p class="dro-h">Fizik muayene</p><div class="dro-mu"><div class="dro-body">${droBodySVG()}<small>Ağrıyan bölgeyi elle muayene et (bölgeye dokun)</small></div><div class="dro-acts col">
      <button type="button" data-dro="m:ates" ${DRO.did.ates?'disabled':''}>${gi('thermo',16)} Ateş ölç</button><button type="button" data-dro="m:steto" ${DRO.did.steto?'disabled':''}>${gi('steto',16)} Kalp ve akciğer dinle</button><button type="button" data-dro="m:hareket" ${DRO.did.hareket?'disabled':''}>${gi('knee',16)} Hareket ve özel testler</button><button type="button" data-dro="m:tansiyon" ${DRO.did.tansiyon?'disabled':''}>${gi('heart',16)} Tansiyon ve nabız</button></div></div>`;}
  else if(step==='tt'){body=`<p class="dro-h">Tetkik iste</p><div class="dro-acts">${Object.entries(DROT).map(([k,[n,key,ic]])=>{const own=UP(key);return `<button type="button" data-dro="t:${k}" ${DRO.did['t'+k]?'disabled':''}>${gi(ic,16)} ${n}<small>${own?'kendi ekipmanın · 10 dk':'hastaneye sevk · 40 dk · '+money(E2U(k==='mr'?600:k==='lab'?120:250))}</small></button>`;}).join('')}</div>`;}
  else if(step==='dx'){const el=drElim(cs);body=`<p class="dro-h">Teşhisin <small>${el.length?`ekipmanın ${el.length} seçeneği eledi`:''}</small></p><div class="dro-acts">${cs.opts.filter(o=>!el.includes(o)).map(o=>`<button type="button" data-dro="dx:${o}">${esc(DR_INJ[o][0])}</button>`).join('')}</div>`;}
  else if(step==='tx'){const D=DR_INJ[cs.i],cat=drCat(cs.i);const ok=cs.ok;const opts=cat==='h'?[['kons','İzolasyon ve dinlenme','Bulaşma riski yok, en uzun süre'],['std','İlaç ve hafif idman','Dengeli program'],['agr','İlaçla oynat','Hızlı dönüş; bulaşma ve kötüleşme riski']]:Object.entries(DR_TR).map(([k,v])=>[k,v.n,v.d]);if(cat==='s'&&D[2][1]>=4)opts.push(['amel','Ameliyat','Uzun vadede güvenli dönüş; ameliyat riski var']);
    body=`<p class="dro-res ${ok?'ok':'bad'}">${ok?'✔ Doğru teşhis':'✘ Teşhis doğru değil'}: ${ok?esc(D[0]):'gerçek durum '+esc(D[0])}</p><p class="dro-h">Tedavi planı</p><div class="dro-acts">${opts.map(([k,n,d])=>`<button type="button" data-dro="tx:${k}">${n}<small>${d}</small></button>`).join('')}</div>`;}
  const found=DRO.found.length?`<ul class="dro-found">${DRO.found.map(([t,c])=>`<li class="${c}">${esc(t)}</li>`).join('')}</ul>`:'<p class="muted" style="margin:0">Henüz bulgu yok. Hastayı dinle, muayene et, gerekirse tetkik iste.</p>';
  return `<div class="dro-ui"><div class="dro-top"><b>Muayene odası</b><span>⏱ ${DRO.min} dk</span><span class="dro-sat">Memnuniyet <i><em style="width:${Math.round(DRO.sat)}%"></em></i></span><button type="button" class="dro-x" data-dro="close" aria-label="Kapat">✕</button></div>
    <div class="dro-tabs">${tabs}</div><div class="dro-grid"><div class="dro-main">${body}${step!=='dx'&&step!=='tx'?`<div class="dro-next"><button type="button" class="cta sm" data-dro="tab:${DRO_STEPS[DRO_STEPS.findIndex(x=>x[0]===step)+1][0]}">Sonraki adım ›</button></div>`:''}</div><div class="dro-notes"><p class="dro-h">Bulgular</p>${found}</div></div></div>`;}
function droBodySVG(){const R={bas:[50,12,9],yuz:[50,24,6],bogaz:[50,33,5],omuz:[30,42,7],gogus:[50,50,10],karin:[50,68,9],bel:[68,70,6],kasik:[50,84,7],uyluk_on:[40,100,7],uyluk_arka:[60,100,7],diz:[42,120,6],baldir:[58,136,6],ayak_bilegi:[44,152,5],ayak:[56,160,5]};
  return `<svg viewBox="0 0 100 170" class="dro-bsvg"><path d="M50 3a10 11 0 1 1 0 22a10 11 0 1 1 0-22M38 30h24l14 14-6 6-8-8v40l4 52h-10l-6-48-6 48H34l4-52V42l-8 8-6-6z" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.35)"/>${Object.entries(R).map(([k,[x,y,r]])=>`<circle cx="${x}" cy="${y}" r="${r}" class="rg${DRO.did['p'+k]?' done':''}" data-dro="p:${k}"><title>${DROREG[k]}</title></circle>`).join('')}</svg>`;}
function droRender(){const el=$('#drOffice');if(!el)return;el.innerHTML=`<div class="dro-wrap">${droScene()}${droUI()}</div>`;const sc=el.querySelector('.dro-scene');if(sc){const w=sc.clientWidth||800,h=sc.clientHeight||400;el.style.setProperty('--ds',String(Math.min(1.15,w/(w<600?560:860),h/(w<600?320:430))));}droPos();droBubble();}
function droUIOnly(){const el=$('#drOffice');if(!el)return;const u=el.querySelector('.dro-ui');if(u)u.outerHTML=droUI();const s=el.querySelector('.dro-xr');if(s){s.className='dro-xr'+(DRO.xray?' on':'');s.innerHTML=DRO.xray?`<b>${esc(DRO.xray)}</b>`:'<span>Görüntü yok</span>';}const ck=el.querySelector('.dro-clock');if(ck)ck.textContent=`${String(9+Math.floor(DRO.min/60)).padStart(2,'0')}:${String(DRO.min%60).padStart(2,'0')}`;}
function droSay(t){DRO.say=t;droBubble();}
function droClick(ev){const b=ev.target.closest('[data-dro]');if(!b)return;const [k,v]=b.dataset.dro.split(':');const cs=droCase();
  if(k==='close'){droClose();return;}if(!cs){droClose();return;}const X=DROX[cs.i]||[];
  if(k==='tab'){DRO.step=v;droUIOnly();return;}
  if(k==='q'){if(DRO.asked[v])return;DRO.asked[v]=1;droTime(3);const q=droQs(cs).find(x=>x[0]===v);const a=q?q[2]():'';droSay(a);droFind(`Hasta: “${a}”`,'q');droUIOnly();return;}
  if(k==='m'){if(DRO.did[v])return;DRO.did[v]=1;droTime(4);
    if(v==='ates'){const t=(X[1]||36.8)+(Math.random()-.5)*.2;droFind(`Ateş: ${dec(t,1)} °C${t>=37.5?' (yüksek)':''}`,t>=37.5?'bad':'');droSay(t>=37.5?'Üşüyorum hocam.':'Ateşim yok sanırım.');}
    else if(v==='steto')droFind(`Dinleme: ${X[4]||'doğal'}`,/hızlı|ağrı|tıkalı/.test(X[4]||'')?'bad':'');
    else if(v==='hareket')droFind(`Hareket testi: ${X[3]||'normal'}`,/pozitif|ağrı|yapamıyor|bükemiyor|kaldıramıyor|bozuk|kısıtlılık/.test(X[3]||'')?'bad':'');
    else if(v==='tansiyon'){const hr=X[1]>=37.5||/Nabız hızlı/.test(X[4]||'')?rint(96,112):rint(58,72);droFind(`Tansiyon 12/8 · Nabız ${hr}/dk${hr>90?' (hızlı)':''}`,hr>90?'bad':'');}
    droUIOnly();return;}
  if(k==='p'){if(DRO.did['p'+v])return;DRO.did['p'+v]=1;droTime(2);const hit=X[0]===v||(v==='ayak'&&X[0]==='ayak_bilegi')||(v==='ayak_bilegi'&&X[0]==='ayak');
    if(hit){droFind(`${DROREG[v]}: ${X[2]}`,'bad');droSay('Ah! Tam orası hocam.');}else{droFind(`${DROREG[v]}: hassasiyet yok`,'');droSay('Orası ağrımıyor.');}droUIOnly();return;}
  if(k==='t'){if(DRO.did['t'+v])return;DRO.did['t'+v]=1;const [n,key]=DROT[v],own=UP(key);if(!own){const cost=E2U(v==='mr'?600:v==='lab'?120:250);if(G.p.money<cost){toast('Hastaneye sevk için bakiyen yetmiyor');DRO.did['t'+v]=0;return;}G.p.money-=cost;}
    droTime(own?10:40);const best=X[5]===v,cat=drCat(cs.i);let r;
    if(best)r=X[6];else if(v==='lab')r=cat==='h'?'Kan: enfeksiyon değerleri hafif yüksek':'Kan: değerler normal';else if(v==='rontgen')r=cat==='h'?'Röntgen: akciğer temiz':'Röntgen: kemikte kırık ya da çıkık yok';else if(v==='ultra')r=cat==='h'?'Ultrason: belirgin bulgu yok':'Ultrason: belirgin yırtık görülmedi';else r='MR: belirgin bulgu yok';
    droFind(`${n}: ${r.replace(/^[^:]*: /,'')}`,best?'key':'');if(v!=='lab')DRO.xray=r;droSay(own?'Sonuçlar hemen geldi.':'Hastaneden döndük hocam.');droUIOnly();return;}
  if(k==='dx'){const ci=droIdx();if(ci<0)return;droTime(2);drDiag(ci,+v);const c2=droCase();if(c2&&c2.ok)droSay('Ne kadar sürer hocam?');else droSay('Emin misiniz hocam?');DRO.step='tx';droRender();return;}
  if(k==='tx'){const ci=droIdx();if(ci<0)return;const sat=DRO.sat,ok=!!(droCase()||{}).ok;drTreat(ci,v);
    try{if(sat>=70&&ok)stBoard(1);else if(sat<35)stBoard(-1);}catch(e){}
    const el=$('#drOffice');DRO.say=ok?'Teşekkürler hocam, söylediklerinizi yapacağım.':'Umarım haklısınızdır hocam…';droBubble();DRO.walk=1;droPos();
    if(el){const u=el.querySelector('.dro-ui');if(u)u.innerHTML=`<div class="dro-top"><b>Vaka tamamlandı</b><button type="button" class="dro-x" data-dro="close">✕</button></div><p class="dro-res ${ok?'ok':'bad'}">${ok?'Doğru teşhis ve tedavi planı kaydedildi.':'Teşhis hatalıydı; sağlık kurulu süreci takip edecek.'} Süre ${DRO.min} dk · memnuniyet %${Math.round(sat)}.</p><div class="dro-next">${stG().cases.some(c=>c.step===0)?'<button type="button" class="cta sm" data-dro="nextp">Sıradaki hasta ›</button>':''}<button type="button" class="btn" data-dro="close">Odadan çık</button></div>`;}
    setTimeout(()=>{DRO.walk=0;droPos();},900);return;}
  if(k==='nextp'){const n=stG().cases.find(c=>c.step===0);if(n)droOpen(n);else droClose();return;}}
/* sağlık merkezine giriş düğmeleri */
drHTML=(old=>function(){let h=old.apply(this,arguments);try{const j=stG(),wait=j.cases.filter(c=>c.step===0).length;
  h=`<button class="cta big dro-cta" data-act="drRoom"><span>${gi('aid',20)} Muayene odası</span><small>${wait?`${wait} hasta bekliyor`:'Bekleyen hasta yok'}</small></button>`+h;
  h=h.replace(/<div class="case"><b>([\s\S]*?)<\/b>/g,(m,b)=>m);j.cases.forEach((cs,ci)=>{if(cs.step!==0)return;const tag=`data-act="drDx" data-c="${ci}"`;const i=h.indexOf(tag);if(i<0)return;const s=h.lastIndexOf('<p class="sub-h"',i);if(s<0)return;h=h.slice(0,s)+`<button class="btn sm dro-in" data-act="drRoom" data-c="${ci}">${gi('steto',14)} Odaya al, muayene et</button>`+h.slice(s);});}catch(e){}return h;})(drHTML);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&DRO.on)droClose();});

/* game-icons.net (CC BY 3.0): Lorc, Delapouite — https://game-icons.net */
