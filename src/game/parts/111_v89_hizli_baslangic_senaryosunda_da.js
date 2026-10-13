/* ================= v89: hızlı başlangıç senaryosunda da karakter oluşturma (ad, soyad, görünüm) ================= */
ACTX.scnGo=el=>{const id=el.dataset.k,sc=scnById(id);if(!sc)return;W.scn=id;W.prof=sc.m==='td'?'td':'oyuncu';
  if(sc.m!=='td'){try{SEL.pos=sc.pos;}catch(e){}}else{W.age=W.age&&W.age>=30?W.age:38;}
  if(W.fn==='Cenk'&&W.ln==='Kuşku'){W.fn='';W.ln='';}W.step='kim';showStart();};
/* karakter ekranı senaryo için uyarlanır */
showStart=(old=>function(){const r=old.apply(this,arguments);try{if(W.step!=='kim'||!W.scn)return r;const sc=scnById(W.scn);if(!sc)return r;const st=$('#start');if(!st)return r;const c=CLUBS[sc.club];
  const back=st.querySelector('.wz-back');if(back){back.dataset.k='scn';back.textContent='‹ Senaryolar';}
  const h2=st.querySelector('h2.h');if(h2)h2.insertAdjacentHTML('afterend',`<section class="panel scn-pick"><span class="scn-ic">${sc.ic||'🎬'}</span>${c?crestSVG(c,34):''}<div><b>${esc(sc.t)}</b><small>${c?esc(c.name)+' · ':''}${sc.m==='td'?'Teknik direktör':`Futbolcu · ${sc.age} yaş · ${esc((POS[sc.pos]||{}).name||'')}`}</small><p class="muted">${esc(sc.d||'')}</p></div></section>`);
  if(sc.m!=='td'){/* yaş ve mevki senaryodan gelir */
    st.querySelectorAll('.lic-info dt').forEach(dt=>{if(dt.textContent.trim()==='Yaş'&&dt.nextElementSibling)dt.nextElementSibling.textContent=sc.age;});
    const pf=st.querySelector('[data-act=selpos]');if(pf){const f=pf.closest('.field');if(f)f.remove();}
    st.querySelectorAll('.field-label').forEach(l=>{if(/Sakal/.test(l.textContent))l.textContent='Sakal';});}
  const go=st.querySelector('[data-act=wzGo]');if(go)go.innerHTML=`<span>Senaryoya başla</span><small>${esc(sc.t)}${c?' · '+esc(c.name):''}</small>`;}catch(e){console.warn(e);}return r;})(showStart);
/* başla: profil senaryoya uygulanır */
ACTX.wzGo=(old=>function(el){if(!W.scn)return old?old.apply(this,arguments):wizGo();const id=W.scn;W.scn=null;wizName();scnStart(id);try{scnProfile();}catch(e){console.warn(e);}})(ACTX.wzGo);
function scnProfile(){if(!G||!G.p)return;const nm=wizName();G.p.name=nm;const L=wizLook();G.p.look=Object.assign({},L,{cenk:false});G.p.h=W.h;try{if(G.mode==='player'&&SEL.foot)G.p.foot=SEL.foot;}catch(e){}
  G.prof=G.prof||W.prof;G.cid=null;G.ms=[];G.msS=null;
  /* senaryo mesajı ve hoş geldin metinlerinde ad */
  for(const m of G.inbox||[]){if(m.body)m.body=m.body.replace(/Cenk Kuşku/g,nm).replace(/\bCenk\b/g,nm.split(' ')[0]);if(m.title)m.title=m.title.replace(/Cenk Kuşku/g,nm).replace(/\bCenk\b/g,nm.split(' ')[0]);}
  save();render();}
/* başlangıç listesinden senaryo ekranına dönüşte seçim sıfırlansın */
document.addEventListener('click',e=>{try{const b=e.target.closest&&e.target.closest('#start [data-act=wz]');if(b&&b.dataset.k!=='kim')W.scn=W.scn&&b.dataset.k==='scn'?null:W.scn;if(b&&b.dataset.k==='list')W.scn=null;}catch(_){}},true);

