/* ================= v83: oyuncu profili — Football Manager tarzı tam ekran sayfa: üst başlık, sekmeler, küçük eylem düğmeleri ve "Eylemler" menüsü ================= */
let PF_CUR=null,PF_TAB='gen';
const PF_TABS=[['gen','Genel'],['attr','Özellikler'],['pos','Pozisyonlar'],['stat','İstatistik'],['kr','Kariyer'],['cp','Karşılaştır']];
const PF_ICO={talk1:'💬',xiTog:'⇅',sellP:'€',loanOut:'↗',ngStart:'✍',wlTog:'☆',squad:'👥',pfWarn:'⚠',pfPraise:'👏',pfFine:'💸',pfCapt:'C',pfFocus:'🎯',pfRest:'🛌',pfShield:'🛡',scShortM:'☆',scRqM:'✍',acadUpPM:'⬆'};
function pfOwn(){try{return !!(PF_CUR&&G&&G.mode==='mgr'&&G.m&&squadOf(G.club).some(x=>x.k===PF_CUR.k));}catch(e){return false;}}
function pfP(){try{return PF_CUR?squadOf(G.club).find(x=>x.k===PF_CUR.k):null;}catch(e){return null;}}
/* ek eylemler (kendi oyuncun, teknik direktör) */
function pfExtra(){if(!pfOwn())return [];const k=PF_CUR.k,cap=(()=>{try{return captOf();}catch(e){return null;}})();
  return [['pfWarn','Uyar','Disiplin ve performans uyarısı'],['pfPraise','Basına övgü','Kamuoyu önünde takdir et'],['pfFine','Para cezası','Haftalık maaşı kadar ceza'],['pfFocus','Bireysel antrenman','Gelişimine özel program (30 gün)'],['pfRest','Dinlendir','Bir sonraki maçta kadroya alma'],['pfShield','Basına karşı koru','Eleştirilere karşı arkasında dur'],cap===k?null:['pfCapt','Kaptan yap','Takım kaptanlığını ver']].filter(Boolean);}
function pfCool(key,days){const m=G.m;m.pfc=m.pfc||{};const t=m.pfc[key];if(t!=null&&G.s.day-t<days){toast(`Bunu yakın zamanda yaptın; ${days-(G.s.day-t)} gün bekle`);return false;}m.pfc[key]=G.s.day;return true;}
function pfDone(t){save();const k=PF_CUR&&PF_CUR.k,id=PF_CUR&&PF_CUR.id;toast(t);try{if(k)showPCard(G.club,k);}catch(e){}}
ACTX.pfWarn=()=>{const p=pfP();if(!p||!pfCool('w'+p.k,10))return;const ps=persOf(p),tough=['Hırslı','Profesyonel','Lider','Kararlı'].includes(ps),f=pFormOf(p)||6.7;
  if(f<6.6||tough){relAdd(p,tough?3:-4);G.m.dev=G.m.dev||{};G.m.dev[p.k]=(G.m.dev[p.k]||0)+0.1;msg('squad',`${p.name} uyarıldı`,tough?`${p.name} uyarıyı ciddiye aldı: “Mesajı aldım hocam.” Antrenmanlara daha sıkı asılacak.`:`${p.name} uyarıdan hoşlanmadı ama mesajı aldı; antrenmanda daha dikkatli.`);pfDone(tough?'Uyarı etkili oldu':'Uyarı verildi, morali biraz düştü');}
  else{relAdd(p,-9);msg('squad',`${p.name} uyarıya tepkili`,`İyi formdaki ${p.name} uyarıyı haksız buldu: “Neyi yanlış yapıyorum?”`);pfDone('Uyarı tepki çekti');}};
ACTX.pfPraise=()=>{const p=pfP();if(!p||!pfCool('p'+p.k,14))return;const f=pFormOf(p)||6.7;const d=f>=6.9?9:f>=6.5?4:-2;relAdd(p,d);try{const m=trInit();m.media=clamp((m.media||50)+1,0,100);}catch(e){}
  msg('press',`Hocadan ${p.name}’e övgü`,d>0?`Basın toplantısında ${p.name} için “takımın en önemli parçalarından” dedin. Oyuncu motive oldu.`:`${p.name} hakkındaki övgülerin formuna bakınca abartılı bulundu.`);pfDone(d>0?'Oyuncu motive oldu':'Övgü havada kaldı');};
ACTX.pfFine=()=>{const p=pfP();if(!p||!pfCool('f'+p.k,21))return;const w=(()=>{try{return Math.round((pWage?pWage(p):pValue(p)*0.12)/52);}catch(e){return Math.round(pValue(p)*0.12/52);}})();
  relAdd(p,-14);try{for(const q of squadOf(G.club))if(q.k!==p.k)relAdd(q,-0.5);}catch(e){}G.m.budget+=Math.max(0,w)*EUR_TL;msg('squad',`${p.name}’e para cezası`,`${p.name} haftalık maaşı kadar (${eur(Math.max(0,w))}) cezaya çarptırıldı. Soyunma odası kararı sessizce izledi; oyuncu kırgın.`);pfDone('Para cezası kesildi');};
ACTX.pfFocus=()=>{const p=pfP();if(!p||!pfCool('t'+p.k,30))return;const young=p.age<=23;G.m.dev=G.m.dev||{};G.m.dev[p.k]=(G.m.dev[p.k]||0)+(young?0.6:0.25);relAdd(p,young?5:2);
  msg('squad',`${p.name} için bireysel program`,`Antrenörler ${p.name} için 30 günlük bireysel çalışma hazırladı. ${young?'Genç oyuncu gelişimini hızlandıracak.':'Deneyimli oyuncu formunu koruyacak.'}`);pfDone('Bireysel antrenman başladı');};
ACTX.pfRest=()=>{const p=pfP();if(!p)return;G.m.rest=G.m.rest||{};G.m.rest[p.k]=G.s.day;try{if(G.m.xi){const i=G.m.xi.indexOf(p.k);if(i>=0){G.m.xi=null;}}}catch(e){}relAdd(p,p.age>=30?3:-1);msg('squad',`${p.name} dinlendirilecek`,`${p.name} bir sonraki maçta kadroya alınmayacak; kondisyon toplayacak.`);pfDone('Oyuncu bir maç dinlendirilecek');};
ACTX.pfShield=()=>{const p=pfP();if(!p||!pfCool('s'+p.k,14))return;relAdd(p,7);try{const m=trInit();m.media=clamp((m.media||50)-1,0,100);}catch(e){}msg('press',`${p.name}’e destek`,`Eleştirilere rağmen ${p.name}’in arkasında durdun: “Ona tam güveniyorum.” Oyuncu bunu unutmayacak.`);pfDone('Oyuncuya destek verdin');};
ACTX.pfCapt=()=>{const p=pfP();if(!p)return;const m=trInit(),old=captOf();m.capk=p.k;relAdd(p,10);try{const o=squadOf(G.club).find(x=>x.k===old);if(o&&o.k!==p.k){relAdd(o,-8);msg('squad','Kaptanlık değişti',`Kaptanlık bandı ${o.name}’den alınıp ${p.name}’e verildi. ${o.name} karardan hoşnut değil.`);}else msg('squad','Yeni kaptan',`${p.name} takımın yeni kaptanı.`);}catch(e){}pfDone(`${p.name} artık kaptan`);};
/* dinlendirilen oyuncu bir sonraki maç kadroda yok */
try{mgrXI=(old=>function(){const r=old.apply(this,arguments);try{const R=G.m&&G.m.rest;if(R&&Array.isArray(r)){const ks=Object.keys(R);if(ks.length){const d=G.s.day,sq=squadOf(G.club);for(const k of ks){if(d-R[k]>10){delete R[k];continue;}const i=r.indexOf(k);if(i>=0){const p=sq.find(x=>x.k===k);const alt=sq.filter(x=>x.pos===(p&&p.pos)&&!r.includes(x.k)&&!R[x.k]).sort((a,b)=>b.ovr-a.ovr)[0];if(alt){const c=r.slice();c[i]=alt.k;return c;}}}}}}catch(e){}return r;})(mgrXI);}catch(e){}
mgrFinish=(old=>function(){const r=old.apply(this,arguments);try{if(G.m&&G.m.rest)G.m.rest={};}catch(e){}return r;})(mgrFinish);

/* ---------- tam ekran düzen ---------- */
function pfRowTxt(pr,lab){if(!pr)return '';for(const r of pr.querySelectorAll('.fmi')){const l=r.querySelector(':scope>span');if(l&&l.textContent.trim()===lab){const b=r.querySelector(':scope>b');if(!b)return '';const c=b.cloneNode(true);c.querySelectorAll('small').forEach(x=>x.remove());return c.textContent.trim();}}return '';}
function pfBuild(mc){if(!mc||mc.classList.contains('pf'))return;const fmp=mc.querySelector(':scope > section.fmp');if(!fmp)return;
  const q=s=>fmp.querySelector(s),pr=q('.fmp-pr'),po=q('.fmp-po'),attr=q('.fmp-attr'),ss=q('.fmp-ss'),krx=mc.querySelector('.fmp-krx'),cpx=mc.querySelector('.fmp-cpx:not(.sr-cp)'),idc=q('.fmp-id');
  const name=((q('.fmp-name')||{}).textContent||'').trim(),ovrH=(q('.fmp-ovr')||{}).innerHTML||'',photo=(q('.fmp-photo')||{}).innerHTML||'',badges=(q('.fmp-badges')||{}).innerHTML||'';
  const hadCp=!!fmp.querySelector('.fmp-tabs [data-k=cp]')||!!cpx;
  /* başlık bilgileri */
  const age=pfRowTxt(pr,'Yaş').replace(/\s*\(.*\)/,''),val=pfRowTxt(pr,'Piyasa Değeri')||pfRowTxt(pr,'İstenen bedel'),mor=pfRowTxt(pr,'Moral'),ctr=pfRowTxt(pr,'Sözleşme');
  const chip=(l,v)=>v?`<div class="pf-ch"><span>${l}</span><b>${esc(v)}</b></div>`:'';
  /* düğmeler */
  const btns=[];mc.querySelectorAll(':scope > .offer-btns [data-act], :scope > button[data-act], :scope > p [data-act]').forEach(b=>{if(b.dataset.act==='closeModal')return;btns.push(b);});
  const prim=btns.filter(b=>b.dataset.act!=='squad').slice(0,3),rest=btns.filter(b=>!prim.includes(b)),ex=pfExtra();
  const sb=b=>{const n=b.cloneNode(true);n.className='pf-b'+(b.classList.contains('cta')?' pri':'');n.removeAttribute('style');const ic=PF_ICO[b.dataset.act],tx=b.textContent.trim();n.title=tx;if(ic)n.innerHTML=`${tx.startsWith(ic)?'':`<i>${ic}</i>`}<span>${esc(tx)}</span>`;if(b.disabled)n.disabled=true;return n.outerHTML;};
  const menu=rest.map(b=>{const n=b.cloneNode(true);n.className='pf-mi';n.removeAttribute('style');n.innerHTML=`<i>${PF_ICO[n.dataset.act]||'•'}</i><span>${esc(b.textContent.trim())}</span>`;return n.outerHTML;}).join('')+
    (ex.length?`<p class="pf-mh">Yönetim</p>`+ex.map(([a,l,d])=>`<button class="pf-mi" data-act="${a}"><i>${PF_ICO[a]||'•'}</i><span>${l}<small>${d}</small></span></button>`).join(''):'');
  const hd=`<header class="pf-hd"><div class="pf-ph">${photo}</div><div class="pf-id"><div class="pf-bd">${badges}</div><h2>${esc(name.replace(/^\d+\.\s*/,''))}</h2><small>${ovrH}</small></div>
    <div class="pf-chs">${chip('Yaş',age)}${chip('Değer',val)}${chip('Moral',mor)}${chip('Sözleşme',ctr.split(/\s{2,}|\n/)[0].slice(0,46))}</div>
    <div class="pf-acts">${prim.map(sb).join('')}${menu?`<div class="pf-more"><button class="pf-b" data-act="pfMenu" aria-expanded="false"><i>⋯</i><span>Eylemler</span></button><div class="pf-menu" hidden>${menu}</div></div>`:''}<button class="pf-x" data-act="closeModal" aria-label="Kapat">✕</button></div></header>`;
  const tabs=PF_TABS.filter(([k])=>k==='gen'||(k==='attr'&&attr)||(k==='pos'&&po)||(k==='stat'&&ss)||(k==='kr'&&krx)||(k==='cp'&&hadCp));
  let cur=tabs.some(t=>t[0]===PF_TAB)?PF_TAB:'gen';
  const nav=`<nav class="pf-tabs">${tabs.map(([k,l])=>`<button data-act="pfTab" data-k="${k}" class="${k===cur?'on':''}">${l}</button>`).join('')}</nav>`;
  const wrap=document.createElement('div');wrap.className='pf-wrap';wrap.innerHTML=hd+nav+`<div class="pf-body fmp" data-tab="pf">${tabs.map(([k])=>`<div class="pf-pane" data-p="${k}"${k===cur?'':' hidden'}></div>`).join('')}</div>`;
  const pane=k=>wrap.querySelector(`.pf-pane[data-p="${k}"]`);
  /* Genel: kimlik kartı + profil bilgileri + diğer her şey */
  const g=pane('gen');const gl=document.createElement('div');gl.className='pf-gen';if(idc){idc.classList.add('pf-card');gl.appendChild(idc);}const gr=document.createElement('div');gr.className='pf-genr';if(pr)gr.appendChild(pr);gl.appendChild(gr);g.appendChild(gl);
  if(ss){const h0=ss.previousElementSibling;const cl=document.createElement('div');cl.className='pf-ssg';cl.innerHTML=(h0&&h0.matches('p.fmp-sec')?h0.outerHTML:'')+ss.outerHTML;gr.appendChild(cl);}
  const sec=(el)=>{const p=el&&el.previousElementSibling;return p&&p.matches('p.fmp-sec')?p:null;};
  if(attr&&pane('attr')){const h=sec(attr);if(h)h.remove();pane('attr').appendChild(attr);}
  if(po&&pane('pos'))pane('pos').appendChild(po);
  if(ss&&pane('stat')){const h=sec(ss);const st=pane('stat');if(h)st.appendChild(h);st.appendChild(ss);
    /* ısı haritası vb. istatistik ekleri: ss ile özellikler arasındaki her şey */
    fmp.querySelectorAll('.hm-wrap,.heat,.fmp-hm').forEach(e=>st.appendChild(e));}
  if(krx&&pane('kr'))pane('kr').appendChild(krx);
  if(cpx&&pane('cp'))pane('cp').appendChild(cpx);
  /* kalanlar Genel'in altına */
  const left=[...fmp.children].filter(e=>!e.matches('.fmp-top'));const left2=[...mc.children].filter(e=>e!==fmp&&!e.matches('.offer-btns'));
  for(const e of left.concat(left2)){if(e.matches&&e.matches('p.fmp-sec')&&!e.nextElementSibling)continue;g.appendChild(e);}
  /* eski üst bölüm ve düğme satırları gizli kalsın (eski kodlar onları arayabilir) */
  const old=document.createElement('div');old.className='pf-old';old.hidden=true;old.appendChild(fmp);mc.querySelectorAll(':scope > .offer-btns').forEach(e=>old.appendChild(e));
  mc.innerHTML='';mc.appendChild(wrap);mc.appendChild(old);mc.classList.add('pf');$('#modal').classList.add('pf-on');mc.scrollTop=0;
  if(cur==='cp'&&!cpx)pfTabGo('cp');}
function pfTabGo(k){const mc=$('#modalCard');if(!mc)return;PF_TAB=k;mc.querySelectorAll('.pf-tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.k===k);if(b.dataset.k===k)try{b.scrollIntoView({inline:'center',block:'nearest'});}catch(e){}});mc.querySelectorAll('.pf-pane').forEach(p=>p.hidden=p.dataset.p!==k);
  const pn=mc.querySelector(`.pf-pane[data-p="${k}"]`);if(pn&&!pn.children.length){const src=mc.querySelector(k==='cp'?'.fmp-cpx:not(.sr-cp)':k==='kr'?'.fmp-krx':'.x-none');if(src)pn.appendChild(src);}
  const b=mc.querySelector('.pf-body');if(b)b.scrollTop=0;}
ACTX.pfTab=el=>pfTabGo(el.dataset.k);
ACTX.pfMenu=el=>{const m=el.parentElement.querySelector('.pf-menu');if(!m)return;m.hidden=!m.hidden;el.setAttribute('aria-expanded',String(!m.hidden));};
document.addEventListener('click',e=>{try{const o=document.querySelector('#modalCard .pf-menu:not([hidden])');if(o&&!e.target.closest('.pf-more'))o.hidden=true;}catch(_){}},true);
/* menüden seçilince menüyü kapat */
document.addEventListener('click',e=>{try{const it=e.target.closest&&e.target.closest('.pf-mi');if(it){const m=it.closest('.pf-menu');if(m)setTimeout(()=>{m.hidden=true;},0);}}catch(_){}});
showPCard=(old=>function(id,k){PF_CUR={id,k};const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!$('#modal').hidden)pfBuild(mc);}catch(e){console.warn('profil',e);}return r;})(showPCard);
openModal=(old=>function(){try{$('#modal').classList.remove('pf-on');$('#modalCard').classList.remove('pf');}catch(e){}const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(mc.querySelector(':scope > section.fmp'))pfBuild(mc);}catch(e){console.warn('profil',e);}return r;})(openModal);
closeModal=(old=>function(){const r=old.apply(this,arguments);try{if($('#modal').hidden){$('#modal').classList.remove('pf-on');$('#modalCard').classList.remove('pf');}}catch(e){}return r;})(closeModal);
document.addEventListener('keydown',e=>{try{if(e.key==='Escape'&&$('#modal').classList.contains('pf-on')&&!$('#modal').hidden)closeModal();}catch(_){}});

