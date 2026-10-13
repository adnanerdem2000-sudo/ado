/* ================= giriş ekranı ve kariyer oluşturma ================= */
const SKIN_OPT=['#f6d6bd','#e2b088','#c08559','#a8704a','#8c5a39','#52301d'],HAIR_OPT=[['curly','Kıvırcık'],['short','Kısa'],['side','Yana tarama'],['fade','Fade'],['buzz','Asker'],['afro','Afro'],['long','Uzun'],['bun','Topuz'],['dread','Örgü'],['mohawk','Mohawk'],['bald','Kel']],
  HC_OPT=['#120b07','#2b1a10','#4a2f18','#7a5230','#c9a35e','#9a4a22'],BD_OPT=[[null,'Yok'],['stub','Kirli sakal'],['goatee','Keçi'],['mus','Bıyık'],['full','Tam sakal']];
const W={step:'list',prof:'oyuncu',fn:'',ln:'',look:{sk:'#a8704a',hc:'#140d09',hs:'curly',bd:null,fw:19,ey:'#1a120c'},h:1.74,age:30,del:null};
function wizLook(){return Object.assign({},W.look,{fw:W.look.fw||19,ey:'#1a120c'});}
function showStart(){$('#app').hidden=true;$('#tabs').hidden=true;const st=$('#start');st.hidden=false;slotMigrate();
  const prev=(fn)=>fn;let h='';
  if(W.step==='list'){const sl=slotsList();
    h=`<div class="start-hero"><div class="kicker">Mahalle sahasından Avrupa’ya</div><h1>Futbol<span>Kariyer Yolculuğu</span></h1></div>
    ${sl.length?`<p class="field-label" style="margin:6px 0 8px">Kayıtlı kariyerler</p><ul class="slots">${sl.map(x=>{const c=CLUBS[x.club];return `<li class="slot">${c?crestSVG(c,40):''}<div><b>${esc(x.name)}</b><small>${esc(x.title||PROF[x.prof]?.n||'')} · ${c?esc(c.name):''}</small><small>${seasonLabel(x.year)} · ${x.age} yaş${x.apps?` · ${x.apps} maç`:''}</small></div><div class="slot-b"><button class="cta sm" data-act="slotGo" data-id="${x.id}">Devam</button><button class="btn ghost sm" data-act="slotDel" data-id="${x.id}">${W.del===x.id?'Emin misin?':'Sil'}</button></div></li>`;}).join('')}</ul>`:''}
    <button class="cta big" data-act="wz" data-k="prof"><span>Yeni kariyer oluştur</span><small>Futbolcu, teknik direktör, yardımcı antrenör, gözlemci ya da doktor</small></button>
    <button class="btn" data-act="startGame">Hızlı başla: futbolcu · rastgele isim</button>
    <button class="btn ghost" data-act="help">Nasıl oynanır?</button>`;}
  else if(W.step==='prof'){h=`<button class="btn ghost sm wz-back" data-act="wz" data-k="list">‹ Geri</button><h2 class="h">Mesleğini seç</h2>
    <div class="profs">${Object.entries(PROF).map(([k,v])=>`<button class="prof ${W.prof===k?'on':''}" data-act="wzProf" data-k="${k}"><i>${v.ic}</i><div><b>${v.n}</b><small>${v.d}</small></div></button>`).join('')}</div>
    <button class="cta big" data-act="wz" data-k="kim"><span>Devam</span><small>${PROF[W.prof].n} olarak karakterini oluştur</small></button>`;}
  else if(W.step==='kim'){const pl=W.prof==='oyuncu',L=wizLook(),age=pl?12:W.age,face=faceSVG(Object.assign({},L,{bd:age>=18?L.bd:null}),pl?{c1:'#2a8c4a',c2:'#ffffff',num:POS[SEL.pos].num}:{coach:true,c1:'#2a8c4a',age});
    h=`<button class="btn ghost sm wz-back" data-act="wz" data-k="prof">‹ Geri</button><h2 class="h">Karakterini oluştur</h2>
    <section class="license wz-lic"><div class="lic-top"><span>${pl?'Futbolcu lisansı':'Personel kartı'}</span><span>${PROF[W.prof].n}</span></div><div class="lic-body"><div class="lic-photo">${face}</div><div class="lic-info"><div class="lic-name" id="wzName">${esc(W.fn||'—')}<br>${esc(W.ln||'')}</div><dl><div><dt>Yaş</dt><dd>${age}</dd></div><div><dt>Boy</dt><dd>${pl?dec(W.h,2)+' m (hedef)':dec(W.h,2)+' m'}</dd></div></dl></div></div></section>
    <div class="field"><span class="field-label">Ad · Soyad</span><div class="wz-names"><input data-in="fn" value="${esc(W.fn)}" maxlength="14" placeholder="Ad" autocomplete="off"><input data-in="ln" value="${esc(W.ln)}" maxlength="16" placeholder="Soyad" autocomplete="off"></div></div>
    <div class="field"><span class="field-label">Ten rengi</span><div class="sw">${SKIN_OPT.map(c=>`<button class="swc ${W.look.sk===c?'on':''}" style="background:${c}" data-act="wzL" data-f="sk" data-v="${c}" aria-label="Ten"></button>`).join('')}</div></div>
    <div class="field"><span class="field-label">Saç modeli</span><div class="chips">${HAIR_OPT.map(([k,n])=>`<button class="chip" data-act="wzL" data-f="hs" data-v="${k}" aria-pressed="${W.look.hs===k}">${n}</button>`).join('')}</div></div>
    <div class="field"><span class="field-label">Saç rengi</span><div class="sw">${HC_OPT.map(c=>`<button class="swc ${W.look.hc===c?'on':''}" style="background:${c}" data-act="wzL" data-f="hc" data-v="${c}" aria-label="Saç rengi"></button>`).join('')}</div></div>
    <div class="field"><span class="field-label">Sakal ${pl?'(18 yaşından sonra)':''}</span><div class="chips">${BD_OPT.map(([k,n])=>`<button class="chip" data-act="wzL" data-f="bd" data-v="${k||''}" aria-pressed="${(W.look.bd||null)===(k||null)}">${n}</button>`).join('')}</div></div>
    <div class="field"><span class="field-label">${pl?'Yetişkin boyu':'Boy'}: <b id="wzH">${dec(W.h,2)} m</b></span><input type="range" min="1.62" max="1.98" step="0.01" value="${W.h}" data-in="h" class="wz-range"></div>
    ${pl?'':`<div class="field"><span class="field-label">Başlangıç yaşı: <b id="wzA">${W.age}</b></span><input type="range" min="24" max="50" step="1" value="${W.age}" data-in="age" class="wz-range"></div>`}
    ${pl?`<div class="field"><span class="field-label">Mevki</span><div class="chips">${Object.entries(POS).map(([k,v])=>`<button class="chip" data-act="selpos" data-v="${k}" aria-pressed="${SEL.pos===k}">${v.name}<small>${v.num} numara</small></button>`).join('')}</div></div>
    <div class="field"><span class="field-label">Kullandığı ayak</span><div class="chips two">${['Sağ','Sol'].map(f=>`<button class="chip" data-act="selfoot" data-v="${f}" aria-pressed="${SEL.foot===f}">${f} ayak</button>`).join('')}</div></div>`:''}
    <button class="cta big" data-act="wzGo"><span>${pl?'Seçmelere katıl':'Kariyere başla'}</span><small>${pl?'Kulüpler seni sahada izleyecek':PROF[W.prof].n+' olarak ilk iş tekliflerini gör'}</small></button>`;}
  st.innerHTML=h;window.scrollTo(0,0);}
document.addEventListener('input',e=>{const el=e.target.closest('[data-in]');if(!el)return;const k=el.dataset.in;
  if(k==='fn'||k==='ln'){W[k]=el.value.replace(/[<>"]/g,'').trimStart();const n=$('#wzName');if(n)n.innerHTML=`${esc(W.fn||'—')}<br>${esc(W.ln||'')}`;}
  else if(k==='h'){W.h=+el.value;const n=$('#wzH');if(n)n.textContent=dec(W.h,2)+' m';}
  else if(k==='age'){W.age=+el.value;const n=$('#wzA');if(n)n.textContent=W.age;}});
function wizName(){let fn=(W.fn||'').trim(),ln=(W.ln||'').trim();if(!fn){const r=Math.random,P=NAMEP.TR;fn=P.f[Math.floor(r()*P.f.length)];ln=ln||P.l[Math.floor(r()*P.l.length)];W.fn=fn;W.ln=ln;}return (fn+' '+ln).trim();}
function wizApply(){const nm=wizName();G.p.name=nm;const L=wizLook();G.p.look=(nm==='Cenk Kuşku'&&L.sk==='#a8704a'&&L.hs==='curly'&&L.hc==='#140d09'&&!L.bd)?null:Object.assign(L,{cenk:false});G.p.h=W.h;G.prof=W.prof;G.cid=null;G.ms=[];G.msS=null;}
function wizGo(){if(W.prof==='oyuncu'){newGame(SEL.pos,SEL.foot,'ferikoy');wizApply();applyBoosts();G.phase='tryout';G.inbox=[];G.tryout=null;G.mode='player';save();TAB='hub';W.step='list';render();window.scrollTo(0,0);return;}
  newGame('OS','Sağ','ferikoy');wizApply();G.p.age=W.age;G.inbox=[];G.history=[];G.totals={apps:0,goals:0,assists:0};
  if(W.prof==='td')startManagerCareer();else startStaffCareer(W.prof);W.step='list';}

