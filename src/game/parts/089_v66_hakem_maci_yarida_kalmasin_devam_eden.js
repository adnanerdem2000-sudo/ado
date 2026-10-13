/* ================= v66: hakem maçı yarıda kalmasın — devam eden maç kaydedilir, geri dönünce kaldığın yerden sürer ================= */
refModal=(old=>function(){try{if(REF&&G){REF.day=REF.day!=null?REF.day:G.s.day;G.refLive=REF;save();}}catch(e){}return old.apply(this,arguments);})(refModal);
refFinish=(old=>function(){const r=old.apply(this,arguments);try{if(G)delete G.refLive;save();}catch(e){}return r;})(refFinish);
ACTX.refGo=(old=>function(el){try{if(isRef()&&G.refLive&&G.refLive.day===G.s.day&&G.refLive.inc&&G.refLive.i<G.refLive.inc.length){REF=G.refLive;refModal();return;}if(G.refLive&&G.refLive.day!==G.s.day)delete G.refLive;}catch(e){}return old.apply(this,arguments);})(ACTX.refGo);
/* maç sırasında pencere yanlışlıkla kapanmasın (arka plana dokunma, Esc, geri) */
closeModal=(old=>function(){try{const mc=$('#modalCard');if(REF&&mc&&mc.querySelector('.refm')&&!mc.querySelector('[data-act=closeModal]')){toast('Maç sürüyor: önce kararını ver');return;}}catch(e){}return old.apply(this,arguments);})(closeModal);
/* uygulama yeniden açılınca ya da sayfaya dönünce yarım maç varsa göster */
refHub=(old=>function(){let h=old.apply(this,arguments);try{const L=G.refLive;if(L&&L.day===G.s.day&&L.inc&&L.i<L.inc.length){h=h.replace('<span>Maçı yönet</span>',`<span>Maça dön</span>`).replace('Pozisyonlarda karar ver',`Yarım kaldı · ${L.i+1}/${L.inc.length}. pozisyon`);}}catch(e){}return h;})(refHub);
render=(old=>function(){const r=old.apply(this,arguments);try{if(isRef()&&G.refLive&&!REF&&G.refLive.day===G.s.day&&$('#modal').hidden&&TAB==='hub'&&!render._refAuto){render._refAuto=1;setTimeout(()=>{render._refAuto=0;if(G&&G.refLive&&!REF&&$('#modal').hidden)ACTX.refGo();},50);}}catch(e){}return r;})(render);
document.addEventListener('visibilitychange',()=>{try{if(document.visibilityState==='visible'&&G&&isRef()&&REF&&$('#modal').hidden)refModal();}catch(e){}});

